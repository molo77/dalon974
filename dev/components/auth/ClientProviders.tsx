"use client";
import { ReactNode } from "react";
import AuthProvider from "@/components/auth/AuthProvider";

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
