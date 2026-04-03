"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Erreur");
      } else {
        setSent(true);
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-sm mx-auto px-4 py-16">
      <h1 className="text-[--text] font-black text-2xl mb-2 text-center">Mot de passe oublié</h1>
      <p className="text-[--text-muted] text-sm text-center mb-8">
        Saisis ton email — on t&apos;envoie un lien pour le réinitialiser.
      </p>

      {sent ? (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 text-center">
          <p className="text-3xl mb-2">📬</p>
          <p className="text-[--text] font-semibold">Vérifie tes emails !</p>
          <p className="text-[--text-muted] text-sm mt-1">
            Si un compte existe pour <strong className="text-[--text]">{email}</strong>, tu recevras un lien dans quelques instants.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-[--bg-card] border border-[--border] rounded-2xl p-5 flex flex-col gap-4">
          <div>
            <label className="text-[--text-muted] text-xs uppercase tracking-widest font-semibold block mb-1.5">Email</label>
            <input
              type="email"
              placeholder="ton@email.fr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className="w-full bg-[--bg-input] border border-[--border] rounded-xl px-4 py-2.5 text-[--text] placeholder-[--text-subtle] focus:ring-2 focus:ring-yellow-400/40 transition-all text-sm"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-bold text-sm py-3 rounded-xl transition-colors"
          >
            {loading ? "Envoi…" : "Envoyer le lien"}
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
