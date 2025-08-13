import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail, User } from "firebase/auth";
import { ensureUserDoc } from "./userService";

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
  await ensureUserDoc(user.uid, {
    email: user.email || "",
    displayName: user.displayName || "",
    role: "user",
    providerId: "google.com",
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
