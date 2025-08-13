"use client";
import { ReactNode, useEffect, useState, createContext, useContext } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  role?: string | null;
};

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoading(false);

      if (u) {
        const userDoc = await getDoc(doc(db, "users", u.uid)); // Correction ici
        if (userDoc.exists()) {
          const data = userDoc.data();
          console.log("Données Firestore utilisateur :", data); // Debug
          setRole(data.role ?? null);
        } else {
          console.log("Aucun document utilisateur trouvé pour", u.uid); // Debug
          setRole(null);
        }
      } else {
        setRole(null);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, role }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
