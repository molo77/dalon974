import { NextResponse } from "next/server";
import prisma from "@/lib/prismaClient";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/authOptions";

export async function GET(req: Request) {
  try {
    // Pagination basique via limit/offset
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10) || 20, 100);
    const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10) || 0, 0);
    
    // Récupérer les paramètres de filtrage
    const ville = searchParams.get("ville");
    const codePostal = searchParams.get("codePostal");
    const prixMax = searchParams.get("prixMax");
    const slugsCsv = searchParams.get("slugs"); // Filtres de communes
    const zonesCsv = searchParams.get("zones"); // Nouveau: filtres de zones (Ouest, Nord, etc.)
    
    // Construire les conditions de filtrage
    const whereConditions: any = {};
    
    if (ville) {
      whereConditions.ville = ville;
    }
    
    if (codePostal) {
      whereConditions.codePostal = codePostal;
    }
    
    if (prixMax && !isNaN(Number(prixMax))) {
      whereConditions.prix = {
        lte: Number(prixMax)
      };
    }
    
    // Récupérer les annonces de la page actuelle avec filtres
    const list = await prisma.annonce.findMany({
      where: whereConditions,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });
    
    // Récupérer le nombre total d'annonces avec les mêmes filtres
    let totalCount = await prisma.annonce.count({
      where: whereConditions
    });
    
    // Définir les zones et leurs communes
    const ZONES = {
      "Nord": ["Saint-Denis","Sainte-Marie","Sainte-Suzanne"],
      "Est": ["Saint-André","Bras-Panon","Salazie","Saint-Benoît","La Plaine-des-Palmistes","Sainte-Rose","Saint-Philippe"],
      "Ouest": ["Le Port","La Possession","Saint-Paul","Trois-Bassins","Saint-Leu","Les Avirons","L'Étang-Salé"],
      "Sud": ["Saint-Louis","Saint-Pierre","Le Tampon","Entre-Deux","Petite-Île","Saint-Joseph","Cilaos"],
      "Intérieur": ["Cilaos","Salazie","La Plaine-des-Palmistes"],
    };

    // Si des filtres de zones sont spécifiés, convertir en communes
    let communesFromZones: string[] = [];
    if (zonesCsv) {
      const wantZones = zonesCsv.split(",").map(s => s.trim()).filter(Boolean);
      communesFromZones = wantZones.flatMap(zone => ZONES[zone as keyof typeof ZONES] || []);
    }

    // Combiner les communes des zones avec les slugs spécifiés directement
    let allWantedCommunes: string[] = [];
    if (slugsCsv) {
      const wantSlugs = slugsCsv.split(",").map(s => s.trim()).filter(Boolean);
      allWantedCommunes = [...wantSlugs];
    }
    if (communesFromZones.length > 0) {
      allWantedCommunes = [...allWantedCommunes, ...communesFromZones];
    }

    // Si des filtres de communes sont spécifiés, filtrer côté serveur
    let finalList = list;
    if (allWantedCommunes.length > 0) {
      // Filtrer les résultats par communes
      finalList = list.filter((annonce: any) => {
        // Vérifier si l'annonce correspond aux communes demandées
        const annonceVille = annonce.ville;
        if (!annonceVille) return false;
        
        // Normaliser le nom de la ville pour la comparaison
        const normalizedVille = annonceVille.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
        return allWantedCommunes.some(commune => {
          const normalizedCommune = commune.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
          return normalizedVille.includes(normalizedCommune) || normalizedCommune.includes(normalizedVille);
        });
      });
      
      // Ajuster le total en fonction du filtrage
      totalCount = finalList.length;
    }
    
    // Map title -> titre for UI compatibility
    const mapped = finalList.map((a: any) => ({ ...a, titre: a.title ?? null }));
    
    // Retourner les données avec le total
    return NextResponse.json({
      items: mapped,
      total: totalCount,
      limit,
      offset
    });
  } catch (e) {
    console.error("[API][annonces][GET]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = (await getServerSession(authOptions as any)) as Session | null;
    const body = await req.json();
    
    // Pour les tests admin, permettre la création sans authentification
    let userId = null;
    if (session?.user?.email) {
      userId = (session.user as any)?.id || null;
    } else {
      // Si pas d'utilisateur connecté, utiliser l'utilisateur admin par défaut
      console.log("[API][annonces][POST] No session, using default admin user");
      const adminUser = await prisma.user.findFirst({
        where: { role: 'admin' }
      });
      userId = adminUser?.id || null;
    }
    const input: any = { ...body };
    // Map UI -> Prisma
    if (typeof input.titre !== "undefined") {
      input.title = input.titre;
      delete input.titre;
    }
    // Garder uniquement les champs supportés par le modèle Prisma
    const allowed = [
      'id', 'title', 'description', 'imageUrl', 'photos', 'mainPhotoIdx',
      'ville', 'prix', 'surface', 'nbChambres', 'equipements', 'typeBien', 'meuble', 'nbPieces',
    ];
    const data: any = {};
    for (const k of allowed) if (k in input) data[k] = input[k];
    // Générer un id si manquant
    if (!data.id) data.id = (globalThis.crypto?.randomUUID?.() || require('crypto').randomUUID());
    // Attribuer l'utilisateur
    data.userId = userId;
    // Timestamp de création si pas fourni
    if (!data.createdAt) data.createdAt = new Date();

    const created = await prisma.annonce.create({ data });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error("[API][annonces][POST]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
