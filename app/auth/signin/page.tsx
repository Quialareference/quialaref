"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

export default function SignInPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isWiki, setIsWiki] = useState(false);

  useEffect(() => {
    setIsWiki(window.location.hostname.includes("wikiref"));
  }, []);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    await signIn("resend", { email, redirect: false, callbackUrl: "/auth/setup" });
    setSent(true);
    setLoading(false);
  }

  async function handleLogin(e: React.FormEvent) {
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
    <main className="max-w-sm mx-auto px-4 py-12">

      {/* Logos */}
      <div className="flex items-center justify-center gap-3 mb-8">
        {isWiki ? (
          <>
            <Link href="https://wikiref.fr"><Image src="/logo-wiki.png" alt="Wikiref" width={120} height={42} className="h-10 w-auto" /></Link>
            <span className="text-[--text-muted] text-2xl font-light">/</span>
            <Link href="https://quialaref.fr"><Image src="/logo.png" alt="Qui a la réf ?" width={120} height={42} className="h-10 w-auto" /></Link>
          </>
        ) : (
          <>
            <Link href="/"><Image src="/logo.png" alt="Qui a la réf ?" width={120} height={42} className="h-10 w-auto" /></Link>
            <span className="text-[--text-muted] text-2xl font-light">/</span>
            <Link href="https://wikiref.fr"><Image src="/logo-wiki.png" alt="Wikiref" width={120} height={42} className="h-10 w-auto" /></Link>
          </>
        )}
      </div>

      {sent ? (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 text-center">
          <p className="text-3xl mb-2">📬</p>
          <p className="text-[--text] font-semibold">Vérifie tes emails !</p>
          <p className="text-[--text-muted] text-sm mt-1">
            Lien envoyé à <strong className="text-[--text]">{email}</strong>
          </p>
          <p className="text-[--text-muted] text-xs mt-3">Clique sur le lien pour choisir ton pseudo et finaliser ton compte.</p>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex bg-white/5 rounded-xl p-1 mb-5">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-2 text-sm font-semibold transition-colors ${
                mode === "login"
                  ? "bg-yellow-400 text-black rounded-lg"
                  : "text-[--text-muted] hover:text-[--text]"
              }`}
            >
              Se connecter
            </button>
            <button
              onClick={() => setMode("register")}
              className={`flex-1 py-2 text-sm font-semibold transition-colors ${
                mode === "register"
                  ? "bg-yellow-400 text-black rounded-lg"
                  : "text-[--text-muted] hover:text-[--text]"
              }`}
            >
              S&apos;inscrire
            </button>
          </div>

          {mode === "login" ? (
            <form onSubmit={handleLogin} className="bg-[--bg-card] border border-[--border] rounded-2xl p-5 flex flex-col gap-4">
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
          ) : (
            <form onSubmit={handleRegister} className="bg-[--bg-card] border border-[--border] rounded-2xl p-5 flex flex-col gap-4">
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
              <p className="text-[--text-muted] text-xs">Tu recevras un lien par email pour finaliser ton inscription et choisir ton pseudo.</p>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-bold text-sm py-3 rounded-xl transition-colors"
              >
                {loading ? "Envoi…" : "Envoyer le lien d'inscription"}
              </motion.button>
            </form>
          )}
        </>
      )}
    </main>
  );
}
