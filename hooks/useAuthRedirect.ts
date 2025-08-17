import { useEffect } from "react";
import { useSession } from "next-auth/react";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export default function useAuthRedirect(router: AppRouterInstance) {
  const { data, status } = useSession();
  useEffect(() => {
    if (status === "authenticated") router.push("/dashboard");
  }, [status, router]);
  return data?.user || null;
}
