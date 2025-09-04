export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 text-yellow-500">
            <svg
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0l1.403 5.777c.1.413.485.677.904.677h4.518c1.78 0 2.52 2.28 1.09 3.5l-3.657 2.84c-.36.28-.52.72-.42 1.13l1.403 5.777c.426 1.756-1.44 3.2-2.93 2.13l-3.657-2.84a1.25 1.25 0 00-1.52 0l-3.657 2.84c-1.49 1.07-3.356-.374-2.93-2.13l1.403-5.777c.1-.41-.06-.85-.42-1.13L2.93 14.27c-1.43-1.22-.69-3.5 1.09-3.5h4.518c.419 0 .804-.264.904-.677l1.403-5.777z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Maintenance en cours
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Nous effectuons actuellement une maintenance programmée pour améliorer nos services.
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-blue-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Informations sur la maintenance
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Mise à jour des systèmes de sécurité</li>
                      <li>Optimisation des performances</li>
                      <li>Amélioration de l'expérience utilisateur</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Temps estimé
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      La maintenance devrait se terminer dans les prochaines minutes. 
                      Merci de votre patience.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => window.location.reload()}
                className="flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Vérifier le statut
              </button>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                Heure: {new Date().toLocaleString("fr-FR")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}