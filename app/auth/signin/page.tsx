"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function SignInPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"magic" | "password">("magic");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    await signIn("resend", { email, redirect: false, callbackUrl: "/auth/setup" });
    setSent(true);
    setLoading(false);
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.error) {
      setError("Email ou mot de passe incorrect.");
      setLoading(false);
    } else {
      router.push("/");
    }
  }

  return (
    <main className="max-w-sm mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-[--text] mb-1">Connexion</h1>
        <p className="text-[--text-muted] text-sm">Connecte-toi pour soumettre des références et modifier le wiki.</p>
      </div>

      {sent ? (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 text-center">
          <p className="text-3xl mb-2">📬</p>
          <p className="text-[--text] font-semibold">Vérifie tes emails !</p>
          <p className="text-[--text-muted] text-sm mt-1">
            Lien envoyé à <strong className="text-[--text]">{email}</strong>
          </p>
          <p className="text-[--text-muted] text-xs mt-3">Si c&apos;est ta première connexion, tu choisiras ton pseudo en cliquant sur le lien.</p>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex bg-white/5 rounded-xl p-1 mb-5">
            <button
              onClick={() => setMode("magic")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${mode === "magic" ? "bg-yellow-400 text-black" : "text-[--text-muted] hover:text-[--text]"}`}
            >
              Lien magique
            </button>
            <button
              onClick={() => setMode("password")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${mode === "password" ? "bg-yellow-400 text-black" : "text-[--text-muted] hover:text-[--text]"}`}
            >
              Mot de passe
            </button>
          </div>

          {mode === "magic" ? (
            <form onSubmit={handleMagicLink} className="bg-[--bg-card] border border-[--border] rounded-2xl p-5 flex flex-col gap-4">
              <div>
                <label className="text-[--text-muted] text-xs uppercase tracking-widest font-semibold block mb-1.5">Email</label>
                <input
                  type="email"
                  placeholder="ton@email.fr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-[--bg-input] border border-[--border] rounded-xl px-4 py-2.5 text-[--text] placeholder-[--text-subtle] focus:ring-2 focus:ring-yellow-400/40 transition-all text-sm"
                  autoFocus
                />
              </div>
              <p className="text-[--text-muted] text-xs">Tu recevras un lien par email. Si c&apos;est ta première fois, tu pourras choisir ton pseudo.</p>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-bold text-sm py-3 rounded-xl transition-colors"
              >
                {loading ? "Envoi…" : "Envoyer le lien magique"}
              </motion.button>
            </form>
          ) : (
            <form onSubmit={handlePassword} className="bg-[--bg-card] border border-[--border] rounded-2xl p-5 flex flex-col gap-4">
              <div>
                <label className="text-[--text-muted] text-xs uppercase tracking-widest font-semibold block mb-1.5">Email</label>
                <input
                  type="email"
                  placeholder="ton@email.fr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-[--bg-input] border border-[--border] rounded-xl px-4 py-2.5 text-[--text] placeholder-[--text-subtle] focus:ring-2 focus:ring-yellow-400/40 transition-all text-sm"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-[--text-muted] text-xs uppercase tracking-widest font-semibold block mb-1.5">Mot de passe</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-[--bg-input] border border-[--border] rounded-xl px-4 py-2.5 text-[--text] placeholder-[--text-subtle] focus:ring-2 focus:ring-yellow-400/40 transition-all text-sm"
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-bold text-sm py-3 rounded-xl transition-colors"
              >
                {loading ? "Connexion…" : "Se connecter"}
              </motion.button>
            </form>
          )}
        </>
      )}
    </main>
  );
}
