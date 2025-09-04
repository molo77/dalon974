"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import ConversationsList from "@/components/messages/ConversationsList";

export default function MessagesPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Chargement...</span>
      </div>
    );
  }

  if (!session) {
    redirect("/login");
  }

  return (
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
  );
}
