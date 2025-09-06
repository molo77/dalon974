"use client";
import { ReactNode } from "react";
import AuthProvider from "./AuthProvider";

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
