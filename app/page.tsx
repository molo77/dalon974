import AnnonceCard from "@/components/AnnonceCard";

const faussesAnnonces = [
  {
    titre: "Chambre dispo à Saint-Denis",
    ville: "Saint-Denis",
    prix: 450,
    imageUrl: "https://source.unsplash.com/400x300/?room",
  },
  {
    titre: "Coloc cool à Saint-Pierre",
    ville: "Saint-Pierre",
    prix: 380,
    imageUrl: "https://source.unsplash.com/400x300/?apartment",
  },
  {
    titre: "Studio partagé à Saint-Gilles",
    ville: "Saint-Gilles",
    prix: 520,
    imageUrl: "https://source.unsplash.com/400x300/?house",
  },
];

export default function HomePage() {
  return (
    <main className="p-6 min-h-screen bg-gray-100 flex flex-col items-center gap-6">
      <h1 className="text-3xl font-bold">Annonces de colocation sur l’île</h1>
      {faussesAnnonces.map((annonce, i) => (
        <AnnonceCard key={i} {...annonce} />
      ))}
    </main>
  );
}
