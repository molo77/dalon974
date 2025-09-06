import { signIn } from "next-auth/react";

export async function signInEmail(email: string, password: string, recaptchaToken?: string) {
  const res = await signIn("credentials", { 
    email, 
    password, 
    recaptchaToken,
    redirect: false 
  });
  if (res?.error) throw new Error(res.error);
  return true;
}

export async function signInGoogle() { return signIn("google", { redirect: true }); }
export async function signInFacebook() { return signIn("facebook", { redirect: true }); }
export async function signInMicrosoft() { return signIn("azure-ad", { redirect: true }); }

export async function resetPassword(_email: string) {
  // Implémenter email de reset si vous activez EmailProvider (magic link) ultérieurement
  throw new Error("Reset password non supporté via NextAuth credentials.");
}

export function currentUser(): null { return null; }
