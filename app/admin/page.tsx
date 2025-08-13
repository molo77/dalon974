"use client";

import { useEffect, useState, useRef } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminAnnonces from "@/components/admin/AdminAnnonces";

export default function AdminPage() {
  const [user, loading] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [activeTab, setActiveTab] = useState<"annonces" | "users">("annonces");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string; id?: string } | null>(null);
  const toastTimeout = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    const checkAdmin = async () => {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const data = userDoc.data();
      const role = data?.role;
      setIsAdmin(role === "admin");
      setCheckingAdmin(false);
    };
    checkAdmin();
  }, [user, loading, router]);

  useEffect(() => {
    if (checkingAdmin) return;
    if (!loading && (!user || !isAdmin)) {
      router.push("/");
    }
  }, [user, isAdmin, loading, checkingAdmin, router]);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message, id: Date.now().toString() });
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast(null), 3500);
  };

  if (loading || checkingAdmin) {
    return (
      <main className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <p className="text-xl">Chargement...</p>
      </main>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-0 flex">
      <aside className="w-64 min-h-screen bg-white shadow-lg flex flex-col gap-2 py-8 px-4 border-r border-slate-200">
        <h2 className="text-xl font-bold text-blue-700 mb-8 text-center tracking-wide">Admin Panel</h2>
        <button
          className={`text-left px-4 py-3 rounded-lg transition ${
            activeTab === "annonces" ? "bg-blue-600 text-white shadow" : "hover:bg-blue-50 text-slate-700"
          }`}
          onClick={() => setActiveTab("annonces")}
        >
          📢 Gestion des annonces
        </button>
        <button
          className={`text-left px-4 py-3 rounded-lg transition ${
            activeTab === "users" ? "bg-blue-600 text-white shadow" : "hover:bg-blue-50 text-slate-700"
          }`}
          onClick={() => setActiveTab("users")}
        >
          👤 Gestion des utilisateurs
        </button>
      </aside>
      <section className="flex-1 px-4 md:px-12 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-extrabold text-blue-800 tracking-tight">
            Administration
          </h1>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-8">
          {activeTab === "annonces" ? (
            <AdminAnnonces showToast={showToast} />
          ) : (
            <AdminUsers showToast={showToast} />
          )}
        </div>
        {/* Toast notification en bas à droite */}
        {toast && (
          <div
            className={`fixed bottom-6 right-6 z-50 px-6 py-3 rounded shadow-lg text-white transition-all
              ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}
            style={{ minWidth: 220 }}
          >
            {toast.message}
          </div>
        )}
      </section>
    </main>
  );
}

    