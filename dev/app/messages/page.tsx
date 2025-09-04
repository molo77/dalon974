"use client";

import AuthGuard from "@/components/auth/AuthGuard";
import ConversationsList from "@/components/messages/ConversationsList";

export default function MessagesPage() {
  return (
    <AuthGuard 
      requireAuth={true}
      redirectTo="/login"
    >
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-8 px-4">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="border-b border-gray-200 p-6">
              <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
              <p className="text-gray-600 mt-1">
                Gérez vos conversations avec les autres utilisateurs
              </p>
            </div>
            
            <div className="p-6">
              <ConversationsList />
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
