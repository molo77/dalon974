export function translateFirebaseError(code?: string): string | undefined {
  if (!code) return undefined;
  switch (code) {
    case "auth/invalid-login-credentials":
    case "auth/invalid-credential":
      return "Identifiants invalides.";
    case "permission-denied":
      return "Accès refusé.";
    default:
      return undefined;
  }
}
