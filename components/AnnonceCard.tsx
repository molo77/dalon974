// components/AnnonceCard.tsx

type AnnonceProps = {
  titre: string;
  ville: string;
  prix: number;
  imageUrl?: string;
};

export default function AnnonceCard({ titre, ville, prix, imageUrl }: AnnonceProps) {
  return (
    <div className="border rounded-xl shadow p-4 w-full max-w-md bg-white">
      {imageUrl && (
        <img
          src={imageUrl}
          alt={titre}
          className="w-full h-48 object-cover rounded mb-2"
        />
      )}
      <h2 className="text-lg font-bold">{titre}</h2>
      <p className="text-sm text-gray-600">{ville}</p>
      <p className="text-blue-600 font-semibold">{prix} € / mois</p>
    </div>
  );
}
