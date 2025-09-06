"use client";

import React from "react";
import AuthGuard from "@/features/auth/AuthGuard";
import ConversationView from "@/features/messages/ConversationView";

interface ConversationPageProps {
  params: Promise<{
    conversationId: string;
  }>;
}

export default function ConversationPage({ params }: ConversationPageProps) {
  const [conversationId, setConversationId] = React.useState<string>("");

  React.useEffect(() => {
    params.then(({ conversationId }) => {
      setConversationId(conversationId);
    });
  }, [params]);

  return (
    <AuthGuard 
      requireAuth={true}
      redirectTo="/login"
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Chargement de la conversation...</span>
        </div>
      }
    >
      {!conversationId ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Chargement de la conversation...</span>
        </div>
      ) : (
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="bg-white rounded-lg shadow-sm h-[600px]">
              <ConversationView conversationId={conversationId} />
            </div>
          </div>
        </div>
      )}
    </AuthGuard>
  );
}
