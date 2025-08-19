"use client";
import { SessionProvider } from "next-auth/react";
import React from "react";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchInterval={60} refetchOnWindowFocus>
      {children}
    </SessionProvider>
  );
}

// Aussi disponible en export nommé pour convenir aux imports existants
export { AuthProvider };
