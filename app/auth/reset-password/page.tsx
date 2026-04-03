"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token || !email) setError("Lien invalide.");
  }, [token, email]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("Les mots de passe ne correspondent pas."); return; }
    if (password.length < 8) { setError("Au moins 8 caractères."); return; }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error ?? "Erreur");
      } else {
        setDone(true);
        setTimeout(() => router.push("/auth/signin"), 2500);
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-sm mx-auto px-4 py-16">
      <h1 className="text-[--text] font-black text-2xl mb-2 text-center">Nouveau mot de passe</h1>
      <p className="text-[--text-muted] text-sm text-center mb-8">
        Choisis un nouveau mot de passe pour ton compte.
      </p>

      {done ? (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 text-center">
          <p className="text-3xl mb-2">✅</p>
          <p className="text-[--text] font-semibold">Mot de passe mis à jour !</p>
          <p className="text-[--text-muted] text-sm mt-1">Redirection vers la connexion…</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-[--bg-card] border border-[--border] rounded-2xl p-5 flex flex-col gap-4">
          <div>
            <label className="text-[--text-muted] text-xs uppercase tracking-widest font-semibold block mb-1.5">Nouveau mot de passe</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              className="w-full bg-[--bg-input] border border-[--border] rounded-xl px-4 py-2.5 text-[--text] placeholder-[--text-subtle] focus:ring-2 focus:ring-yellow-400/40 transition-all text-sm"
            />
          </div>
          <div>
            <label className="text-[--text-muted] text-xs uppercase tracking-widest font-semibold block mb-1.5">Confirmer</label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="w-full bg-[--bg-input] border border-[--border] rounded-xl px-4 py-2.5 text-[--text] placeholder-[--text-subtle] focus:ring-2 focus:ring-yellow-400/40 transition-all text-sm"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading || !token || !email}
            className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-bold text-sm py-3 rounded-xl transition-colors"
          >
            {loading ? "Enregistrement…" : "Enregistrer le mot de passe"}
          </motion.button>
        </form>
      )}

      <p className="text-center mt-5">
        <Link href="/auth/signin" className="text-[--text-muted] hover:text-[--text] text-sm transition-colors">
          ← Retour à la connexion
        </Link>
      </p>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
