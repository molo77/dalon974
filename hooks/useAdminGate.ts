import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export default function useAdminGate(params: {
  user: any;
  loading: boolean;
  router: AppRouterInstance;
}) {
  const { router } = params;
  const { user, loading: authLoading, isAdmin: ctxIsAdmin } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    // Le rôle vient du contexte AuthProvider (suivi temps réel)
    setIsAdmin(!!ctxIsAdmin);
    setCheckingAdmin(false);
  }, [user, authLoading, ctxIsAdmin, router]);

  useEffect(() => {
    if (checkingAdmin) return;
    if (!authLoading && (!user || !isAdmin)) {
      router.push("/");
    }
  }, [user, isAdmin, authLoading, checkingAdmin, router]);

  return { isAdmin, checkingAdmin };
}
