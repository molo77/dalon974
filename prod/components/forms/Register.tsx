

"use client";

import { useState, ChangeEvent, FormEvent } from "react";

type RegisterProps = {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
};

export default function Register({ onSuccess, onSwitchToLogin }: RegisterProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailInUse, setEmailInUse] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setInfo(null);
    setEmailInUse(false);

    const rawEmail = email.trim();
    const normEmail = rawEmail.toLowerCase();

    if (!rawEmail) {
      setError("Veuillez saisir un email.");
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(rawEmail)) {
      setError("Format d'email invalide.");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normEmail, password, displayName: email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur lors de l'inscription.");
        setEmailInUse(data.error && data.error.includes("existe déjà"));
        setLoading(false);
        return;
      }
      setInfo("Inscription réussie ! Vous pouvez vous connecter.");
      setEmail("");
      setPassword("");
      setConfirm("");
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError((err as Error)?.message || "Erreur lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        type="email"
        placeholder="Email"
        value={email}
  onChange={(e: ChangeEvent<HTMLInputElement>) => {
          setEmail(e.target.value);
          if (emailInUse) setEmailInUse(false);
        }}
        className="border rounded px-3 py-2"
        autoComplete="email"
        required
      />
      <input
        type="password"
        placeholder="Mot de passe (min 6 caractères)"
        value={password}
  onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
        className="border rounded px-3 py-2"
        autoComplete="new-password"
        minLength={6}
        required
      />
      <input
        type="password"
        placeholder="Confirmer le mot de passe"
        value={confirm}
  onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirm(e.target.value)}
        className="border rounded px-3 py-2"
        autoComplete="new-password"
        minLength={6}
        required
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {emailInUse && onSwitchToLogin && (
        <button
          type="button"
          onClick={() => onSwitchToLogin()}
          className="text-blue-600 underline text-sm self-start"
        >
          Aller à la connexion
        </button>
      )}
      {info && <p className="text-sm text-green-600">{info}</p>}
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-60"
      >
        {loading ? "Création..." : "Créer le compte"}
      </button>
    </form>
  );
}