import { NextResponse } from "next/server";
import { auth } from "@/config/auth";
import prisma from "@/infrastructure/database/prismaClient";

export async function POST() {
  try {
    const session = await auth();
    const isAdmin = (session?.user as any)?.role === "admin";
    if (!isAdmin) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    console.log('➕ Création de données d\'exemple...');

    // Récupérer un utilisateur existant ou en créer un
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Utilisateur Test',
          role: 'user'
        }
      });
      console.log('✅ Utilisateur créé:', user.email);
    } else {
      console.log('✅ Utilisateur existant utilisé:', user.email);
    }

    // Ajouter des annonces de test (sans champs de modération pour la prod)
    const annonces = [
      {
        id: `test-annonce-${Date.now()}-1`,
        title: 'Colocation disponible à Saint-Denis',
        description: 'Belle colocation dans un appartement moderne, proche du centre-ville et des transports. Chambre meublée de 15m² avec salle de bain privative.',
        ville: 'Saint-Denis',
        prix: 450,
        surface: 15,
        nbChambres: 1,
        typeBien: 'Appartement',
        meuble: true,
        nbPieces: 4,
        disponibleAPartir: '2024-01-01'
      },
      {
        id: `test-annonce-${Date.now()}-2`,
        title: 'Chambre en colocation à Sainte-Suzanne',
        description: 'Chambre dans une maison avec jardin, quartier calme. Idéal pour étudiant ou jeune professionnel. Charges comprises.',
        ville: 'Sainte-Suzanne',
        prix: 380,
        surface: 12,
        nbChambres: 1,
        typeBien: 'Maison',
        meuble: true,
        nbPieces: 5,
        disponibleAPartir: '2024-01-15'
      },
      {
        id: `test-annonce-${Date.now()}-3`,
        title: 'Studio en colocation à Saint-André',
        description: 'Studio entièrement rénové, meublé et équipé. Proche des commerces et des transports. Idéal pour une personne seule.',
        ville: 'Saint-André',
        prix: 520,
        surface: 20,
        nbChambres: 1,
        typeBien: 'Studio',
        meuble: true,
        nbPieces: 1,
        disponibleAPartir: '2024-02-01'
      },
      {
        id: `test-annonce-${Date.now()}-4`,
        title: 'Colocation T3 à Saint-Pierre',
        description: 'Appartement T3 en colocation, proche de l\'université. Chambre de 12m² avec bureau intégré. Cuisine équipée partagée.',
        ville: 'Saint-Pierre',
        prix: 420,
        surface: 12,
        nbChambres: 1,
        typeBien: 'Appartement',
        meuble: true,
        nbPieces: 3,
        disponibleAPartir: '2024-02-15'
      },
      {
        id: `test-annonce-${Date.now()}-5`,
        title: 'Chambre dans maison à La Possession',
        description: 'Chambre dans une maison individuelle avec piscine. Quartier résidentiel calme, proche des commerces.',
        ville: 'La Possession',
        prix: 350,
        surface: 14,
        nbChambres: 1,
        typeBien: 'Maison',
        meuble: true,
        nbPieces: 4,
        disponibleAPartir: '2024-03-01'
      }
    ];

    const createdAnnonces = [];
    for (const annonceData of annonces) {
      try {
        const annonce = await prisma.annonce.create({
          data: {
            ...annonceData,
            userId: user.id
          }
        });
        createdAnnonces.push(annonce);
        console.log(`✅ Annonce créée: ${annonce.title} (${annonce.ville})`);
      } catch (error) {
        console.log(`⚠️ Erreur pour l'annonce ${annonceData.title}:`, error);
      }
    }

    // Créer quelques profils de colocataires de test
    const colocProfiles = [
      {
        id: `test-coloc-${Date.now()}-1`,
        userId: user.id,
        title: 'Profil Colocataire Test 1',
        nom: 'Marie',
        ville: 'Saint-Denis',
        budget: 400,
        age: 25,
        profession: 'Étudiante',
        description: 'Étudiante en master, recherche une colocation sympa pour finir mes études.',
        bioCourte: 'Étudiante sérieuse et sociable',
        genre: 'Femme',
        dateDispo: '2024-02-01'
      },
      {
        id: `test-coloc-${Date.now()}-2`,
        userId: user.id,
        title: 'Profil Colocataire Test 2',
        nom: 'Pierre',
        ville: 'Saint-Pierre',
        budget: 450,
        age: 28,
        profession: 'Ingénieur',
        description: 'Jeune ingénieur, recherche une colocation avec des personnes actives.',
        bioCourte: 'Ingénieur sportif et organisé',
        genre: 'Homme',
        dateDispo: '2024-02-15'
      }
    ];

    const createdColocs = [];
    for (const colocData of colocProfiles) {
      try {
        const coloc = await prisma.colocProfile.create({
          data: colocData
        });
        createdColocs.push(coloc);
        console.log(`✅ Profil colocataire créé: ${coloc.title}`);
      } catch (error) {
        console.log(`⚠️ Erreur pour le profil ${colocData.title}:`, error);
      }
    }

    console.log('\n✅ Données d\'exemple créées!');

    return NextResponse.json({
      success: true,
      message: 'Données d\'exemple créées avec succès',
      data: {
        annonces: createdAnnonces.length,
        colocProfiles: createdColocs.length,
        user: user.email
      }
    });

  } catch (error) {
    console.error("[API][admin][seed-data][POST]", error);
    return NextResponse.json({ 
      error: "Erreur lors de la création des données d'exemple",
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
