"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import ConversationView from "@/components/messages/ConversationView";

interface ConversationPageProps {
  params: Promise<{
    conversationId: string;
  }>;
}

export default function ConversationPage({ params }: ConversationPageProps) {
  const { data: session, status } = useSession();
  const [conversationId, setConversationId] = React.useState<string>("");

  React.useEffect(() => {
    params.then(({ conversationId }) => {
      setConversationId(conversationId);
    });
  }, [params]);

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

  if (!conversationId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Chargement de la conversation...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-sm h-[600px]">
          <ConversationView conversationId={conversationId} />
        </div>
      </div>
    </div>
  );
}
