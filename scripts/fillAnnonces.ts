// scripts/fillAnnonces.ts
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as fs from "fs";

const serviceAccount = JSON.parse(fs.readFileSync("dalon974-adminsdk.json", "utf-8"));

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

const annonces = [
  {
    titre: "Coloc à Saint-Denis",
    ville: "Saint-Denis",
    prix: 450,
    imageUrl: "https://source.unsplash.com/400x300/?room",
  },
  {
    titre: "Coloc étudiante à Saint-Pierre",
    ville: "Saint-Pierre",
    prix: 380,
    imageUrl: "https://source.unsplash.com/400x300/?apartment",
  },
  {
    titre: "Chambre à Saint-Gilles",
    ville: "Saint-Gilles",
    prix: 520,
    imageUrl: "https://source.unsplash.com/400x300/?house",
  },
  {
    titre: "Studio partagé à Sainte-Clotilde",
    ville: "Sainte-Clotilde",
    prix: 410,
    imageUrl: "https://source.unsplash.com/400x300/?studio",
  },
];

async function main() {
  const batch = db.batch();
  const collectionRef = db.collection("annonces");

  for (const annonce of annonces) {
    const docRef = collectionRef.doc();
    batch.set(docRef, {
      ...annonce,
      createdAt: new Date(),
    });
  }

  await batch.commit();
  console.log("🔥 Annonces ajoutées à Firestore !");
}

main().catch((err) => console.error(err));
