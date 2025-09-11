import { useEffect, useRef, useState } from "react";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export default function useAdminGate(params: {
  user: any;
  loading: boolean;
  router: AppRouterInstance;
  refreshOnUserChange?: boolean; // si true, re-vérifie sur changement user
}) {
  const { router, refreshOnUserChange } = params;
  const user = params.user as any;
  const authLoading = params.loading;
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const checkedRef = useRef(false);

  useEffect(() => {
    if (authLoading) return; // attend fin du chargement auth
    if (checkedRef.current && !refreshOnUserChange) return; // ne refait pas si déjà vérifié
    checkedRef.current = true;
    
    // En mode développement, permettre l'accès admin sans authentification
    if (typeof window !== "undefined" && window.location.hostname === "localhost") {
      setIsAdmin(true);
      setCheckingAdmin(false);
      return;
    }
    
    if (!user) {
      setIsAdmin(false);
      setCheckingAdmin(false);
      router.replace("/login");
      return;
    }
    const role = user?.role;
    const ok = role === "admin";
    setIsAdmin(ok);
    setCheckingAdmin(false);
    if (!ok) router.replace("/");
  }, [authLoading, user, router, refreshOnUserChange]);

  return { isAdmin, checkingAdmin };
}
