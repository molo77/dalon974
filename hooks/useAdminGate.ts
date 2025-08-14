import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export default function useAdminGate(params: {
  user: any;
  loading: boolean;
  router: AppRouterInstance;
}) {
  const { user, loading, router } = params;
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    (async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const role = userDoc.data()?.role;
        setIsAdmin(role === "admin");
      } finally {
        setCheckingAdmin(false);
      }
    })();
  }, [user, loading, router]);

  useEffect(() => {
    if (checkingAdmin) return;
    if (!loading && (!user || !isAdmin)) {
      router.push("/");
    }
  }, [user, isAdmin, loading, checkingAdmin, router]);

  return { isAdmin, checkingAdmin };
}
