const ERROR_MAP: Record<string, string> = {
  // Auth
  "auth/wrong-password": "Mot de passe incorrect.",
  "auth/user-not-found": "Aucun compte trouvé avec cet email.",
  "auth/invalid-login-credentials": "Identifiants invalides.",
  "auth/invalid-credential": "Identifiants invalides.",
  "auth/email-already-in-use": "Un compte existe déjà avec cet email.",
  "auth/email already in use": "Un compte existe déjà avec cet email.", // variante avec espaces
  "auth/too-many-requests": "Trop de tentatives. Réessayez plus tard.",
  "auth/popup-closed-by-user": "La fenêtre a été fermée avant la fin de la connexion.",
  "auth/cancelled-popup-request": "Une autre fenêtre d’authentification est déjà ouverte.",
  "auth/popup-blocked": "La fenêtre d’authentification a été bloquée.",
  "auth/network-request-failed": "Erreur réseau. Vérifiez votre connexion.",
  "auth/internal-error": "Erreur interne. Réessayez plus tard.",
  "auth/user-disabled": "Ce compte a été désactivé.",
  "auth/operation-not-allowed": "Ce mode de connexion n’est pas activé.",
  "auth/requires-recent-login": "Veuillez vous reconnecter pour effectuer cette action.",
  // Firestore / Génériques
  "permission-denied": "Accès refusé.",
  "not-found": "Ressource introuvable.",
  "already-exists": "Cet enregistrement existe déjà.",
  "failed-precondition": "Précondition non remplie.",
  "aborted": "Opération interrompue.",
  "resource-exhausted": "Quota dépassé.",
  "unavailable": "Service indisponible. Réessayez.",
  "deadline-exceeded": "Délai dépassé, réessayez.",
  "unauthenticated": "Authentification requise.",
};

export function translateFirebaseError(
  code?: string,
  opts?: { log?: boolean }
): string {
  if (!code) {
    if (process.env.NODE_ENV === "development" && opts?.log) {
      // Log seulement si demandé
      // eslint-disable-next-line no-console
      console.warn("[FirebaseError] Code indéfini");
    }
    return "Erreur inconnue.";
  }
  const normalized = code.trim().toLowerCase().replace(/\s+/g, "-");

  // Erreur connue (pas de console.error pour éviter la stack)
  if (ERROR_MAP[code]) {
    if (process.env.NODE_ENV === "development" && opts?.log) {
      // eslint-disable-next-line no-console
      console.info("[FirebaseError connu]", code);
    }
    return ERROR_MAP[code];
  }
  if (ERROR_MAP[normalized]) {
    if (process.env.NODE_ENV === "development" && opts?.log) {
      // eslint-disable-next-line no-console
      console.info("[FirebaseError connu]", code, "→", normalized);
    }
    return ERROR_MAP[normalized];
  }

  // Code inconnu : on log en dev uniquement
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.warn("[FirebaseError] Code non mappé :", code);
  }
  return `Erreur : ${code}`;
}
