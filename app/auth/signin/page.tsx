"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await signIn("resend", { email, redirect: false, callbackUrl: "/submit" });
    setSent(true);
    setLoading(false);
  }

  return (
    <main className="max-w-sm mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-[--text] mb-1">Connexion</h1>
        <p className="text-[--text-muted] text-sm">Pour soumettre des références, connecte-toi par email.</p>
      </div>

      {sent ? (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 text-center">
          <p className="text-3xl mb-2">📬</p>
          <p className="text-[--text] font-semibold">Vérifie tes emails !</p>
          <p className="text-[--text-muted] text-sm mt-1">
            Lien envoyé à <strong className="text-[--text]">{email}</strong>
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-[--bg-card] border border-[--border] rounded-2xl p-5">
          <label className="text-[--text-muted] text-xs uppercase tracking-widest font-semibold mb-1.5 block">Email</label>
          <input
            type="email"
            placeholder="ton@email.fr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-[--bg-input] border border-[--border] rounded-xl px-4 py-2.5 text-[--text] placeholder-[--text-subtle] focus:ring-2 focus:ring-yellow-400/40 transition-all mb-4 text-sm"
            autoFocus
          />
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-bold text-sm py-3 rounded-xl transition-colors"
          >
            {loading ? "Envoi…" : "Envoyer le lien magique"}
          </motion.button>
        </form>
      )}
    </main>
  );
}
