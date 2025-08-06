import AnnonceCard from "@/components/AnnonceCard";
import { getAnnonces } from "@/lib/firestore";

export default async function HomePage() {
  const annonces = await getAnnonces();

  return (
    <main className="p-6 min-h-screen bg-gray-100 flex flex-col items-center gap-6">
      <h1 className="text-3xl font-bold">Annonces de colocation sur l’île</h1>

      {annonces.length === 0 && <p>Aucune annonce disponible.</p>}

      {annonces.map((annonce) => (
        <AnnonceCard key={annonce.id} {...annonce} />
      ))}
    </main>
  );
}
