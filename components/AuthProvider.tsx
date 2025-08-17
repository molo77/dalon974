"use client";
import { ReactNode, createContext, useContext } from "react";
import { useSession } from "next-auth/react";
import type { User as NextAuthUser } from "next-auth";

type AuthContextType = {
  user: { id: string; email?: string | null; name?: string | null } | null;
  loading: boolean;
  role?: string | null;
  isAdmin?: boolean;
};

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data, status } = useSession();
  const sessionUser = data?.user as (NextAuthUser & { id?: string; role?: string }) | undefined;
  const role = (sessionUser as any)?.role || null;
  const isAdmin = role === "admin";
  const user = sessionUser ? { id: (sessionUser as any).id || "", uid: (sessionUser as any).id || "", email: sessionUser.email || null, name: sessionUser.name || null } : null;

  return (
    <AuthContext.Provider value={{ user, loading: status === "loading", role, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
