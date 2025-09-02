"use client";

import Link from "next/link";

export default function VerifyRequestPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dalon974</h1>
          <h2 className="text-xl font-semibold text-gray-600">Vérifiez votre email</h2>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              Email envoyé avec succès !
            </h3>
            
            <p className="mt-2 text-sm text-gray-600">
              Un lien de connexion a été envoyé à votre adresse email. 
              Vérifiez votre boîte de réception et cliquez sur le lien pour vous connecter.
            </p>
            
            <div className="mt-6">
              <p className="text-xs text-gray-500">
                Si vous ne recevez pas l'email dans les prochaines minutes, 
                vérifiez votre dossier spam ou{" "}
                <Link href="/signup" className="text-blue-600 hover:text-blue-500">
                  réessayez
                </Link>
                .
              </p>
            </div>
          </div>

          <div className="mt-8">
            <Link
              href="/"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
