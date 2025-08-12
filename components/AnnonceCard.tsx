type AnnonceProps = {
  id: string;
  titre: string;
  ville: string;
  prix?: number;
  imageUrl?: string;
  onDelete?: () => void;
  onEdit?: () => void;
};

export default function AnnonceCard({
  id,
  titre,
  ville,
  prix,
  imageUrl,
  onDelete,
  onEdit,
}: AnnonceProps) {
  return (
    <div className="relative border rounded-xl shadow p-4 w-full bg-white">
      {imageUrl && (
        <img
          src={imageUrl}
          alt={titre}
          className="w-full h-48 object-cover rounded mb-2"
        />
      )}

      <h2 className="text-lg font-bold">
        <a href={`/annonce/${id}`} className="hover:underline">
          {titre}
        </a>
      </h2>

      <p className="text-sm text-gray-600">📍 {ville}</p>
      <p className="text-blue-600 font-semibold">
        {prix ? `${prix} € / mois` : "Prix non renseigné"}
      </p>

      {onDelete && (
        <button
          onClick={onDelete}
          className="absolute top-2 right-2 text-red-500 hover:text-red-700"
          title="Supprimer l'annonce"
        >
          🗑
        </button>
      )}

      {onEdit && (
        <button
          onClick={onEdit}
          className="absolute top-2 right-10 text-gray-500 hover:text-black"
          title="Modifier l'annonce"
        >
          ✏️
        </button>
      )}
    </div>
  );
}
