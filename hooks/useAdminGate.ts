import { useEffect, useState } from "react";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export default function useAdminGate(params: {
  user: any;
  loading: boolean;
  router: AppRouterInstance;
}) {
  const { router } = params;
  const user = params.user as any;
  const authLoading = params.loading;
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    // Rôle depuis la session NextAuth
    const role = (user as any)?.role;
    setIsAdmin(role === "admin");
    setCheckingAdmin(false);
  }, [user, authLoading, router]);

  useEffect(() => {
    if (checkingAdmin) return;
    if (!authLoading && (!user || !isAdmin)) {
      router.push("/");
    }
  }, [user, isAdmin, authLoading, checkingAdmin, router]);

  return { isAdmin, checkingAdmin };
}
