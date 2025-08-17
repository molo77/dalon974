import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail, User } from "firebase/auth";

export async function signInEmail(email: string, password: string) {
  const auth = getAuth();
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function signInGoogle() {
  const auth = getAuth();
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const user = result.user;
  // Appel API côté serveur pour créer/mettre à jour l'utilisateur
  await fetch('/api/user/ensure', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      uid: user.uid,
      email: user.email || "",
      displayName: user.displayName || "",
      role: "user",
      providerId: "google.com",
    }),
  });
  return user;
}

export async function resetPassword(email: string) {
  const auth = getAuth();
  await sendPasswordResetEmail(auth, email);
}

export function currentUser(): User | null {
  return getAuth().currentUser;
}
