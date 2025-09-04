import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface UseAuthGuardOptions {
  redirectTo?: string;
  requireAuth?: boolean;
  onUnauthorized?: () => void;
}

interface UseAuthGuardReturn {
  user: any;
  loading: boolean;
  isAuthenticated: boolean;
  isReady: boolean;
}

export default function useAuthGuard(options: UseAuthGuardOptions = {}): UseAuthGuardReturn {
  const { redirectTo = "/login", requireAuth = true, onUnauthorized } = options;
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Attendre que la session soit chargée
    if (status === "loading") {
      setIsReady(false);
      return;
    }

    // Si l'authentification est requise et l'utilisateur n'est pas connecté
    if (requireAuth && !session) {
      console.log("[AuthGuard] Utilisateur non authentifié, redirection vers:", redirectTo);
      if (onUnauthorized) {
        onUnauthorized();
      } else {
        router.replace(redirectTo);
      }
      setIsReady(false);
      return;
    }

    // Si l'utilisateur est connecté ou si l'authentification n'est pas requise
    setIsReady(true);
  }, [session, status, requireAuth, redirectTo, router, onUnauthorized]);

  return {
    user: session?.user || null,
    loading: status === "loading",
    isAuthenticated: !!session,
    isReady: isReady && (requireAuth ? !!session : true)
  };
}
