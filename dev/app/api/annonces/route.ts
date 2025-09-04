import { NextResponse } from "next/server";
import prisma from "@/infrastructure/database/prismaClient";
import { auth } from "@/config/auth";
// import type { Session } from "next-auth";

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
    const mapped = finalList.map((a: any) => ({ 
      ...a, 
      titre: a.title || a.titre || null,
      userId: a.userId || null
    }));
    
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
            const session = await auth();
    const body = await req.json();
    
    console.log("[API][annonces][POST] Session:", session);
    console.log("[API][annonces][POST] Session user:", session?.user);
    
    // Récupérer l'ID de l'utilisateur connecté
    let userId = null;
    if (session?.user?.email) {
      // Essayer plusieurs façons de récupérer l'ID
      userId = (session.user as any)?.id || 
               (session.user as any)?.sub || 
               null;
      
      console.log("[API][annonces][POST] User ID from session:", userId);
      
      // Si l'ID n'est pas dans la session, le récupérer depuis la base de données
      if (!userId) {
        console.log("[API][annonces][POST] User ID not in session, fetching from DB");
        const user = await prisma.user.findUnique({
          where: { email: session.user.email }
        });
        userId = user?.id || null;
        console.log("[API][annonces][POST] User ID from DB:", userId);
      }
    } else {
      // Si pas d'utilisateur connecté, utiliser l'utilisateur admin par défaut
      console.log("[API][annonces][POST] No session found, using default admin user");
      const adminUser = await prisma.user.findFirst({
        where: { role: 'admin' }
      });
      if (adminUser) {
        userId = adminUser.id;
        console.log("[API][annonces][POST] Using default admin user:", adminUser.email);
      } else {
        console.error("[API][annonces][POST] No admin user found");
        return NextResponse.json({ error: "No admin user available" }, { status: 500 });
      }
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
    if (!data.id) data.id = (globalThis.crypto?.randomUUID?.() || (await import('crypto')).randomUUID());
    // Vérifier que l'utilisateur est connecté
    if (!userId) {
      console.error("[API][annonces][POST] No user ID found");
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }
    
    // Vérifier que l'utilisateur existe et a un rôle
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true }
    });
    
    if (!user) {
      console.error("[API][annonces][POST] User not found in database");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    console.log("[API][annonces][POST] User found:", { id: user.id, email: user.email, role: user.role });
    
    // Attribuer l'utilisateur
    data.userId = userId;
    console.log("[API][annonces][POST] Creating annonce with userId:", userId);
    console.log("[API][annonces][POST] Session user:", session?.user);
    
    // Timestamp de création si pas fourni
    if (!data.createdAt) data.createdAt = new Date();

    const created = await prisma.annonce.create({ data });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error("[API][annonces][POST]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
