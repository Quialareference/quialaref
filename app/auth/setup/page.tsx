"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function SetupPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
    if (status === "authenticated" && session?.user?.username) router.push("/");
  }, [status, session, router]);

  if (status === "loading" || status === "unauthenticated") {
    return <main className="flex items-center justify-center min-h-screen"><div className="text-white/50 animate-pulse">Chargement…</div></main>;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (username.trim().length < 2) { setError("Le pseudo doit faire au moins 2 caractères."); return; }
    if (password.length < 6) { setError("Le mot de passe doit faire au moins 6 caractères."); return; }
    if (password !== confirm) { setError("Les mots de passe ne correspondent pas."); return; }

    setLoading(true);
    const res = await fetch("/api/auth/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username.trim(), password }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Une erreur est survenue.");
      setLoading(false);
      return;
    }

    await update();

    // Sync session to other domain
    try {
      const tokenRes = await fetch("/api/auth/cross-domain-token");
      if (tokenRes.ok) {
        const { token } = await tokenRes.json();
        const currentHost = window.location.hostname;
        const otherDomain = currentHost.includes("wikiref") ? "https://quialaref.fr" : "https://wikiref.fr";
        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
        iframe.src = `${otherDomain}/api/auth/cross-domain-callback?token=${token}`;
        document.body.appendChild(iframe);
        setTimeout(() => iframe.remove(), 5000);
      }
    } catch {}

    router.push("/");
  }

  return (
    <main className="max-w-sm mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <p className="text-4xl mb-3">👋</p>
        <h1 className="text-2xl font-bold text-[--text] mb-1">Bienvenue !</h1>
        <p className="text-[--text-muted] text-sm">Choisis ton pseudo et un mot de passe pour finaliser ton compte.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-[--bg-card] border border-[--border] rounded-2xl p-5 flex flex-col gap-4">
        <div>
          <label className="text-[--text-muted] text-xs uppercase tracking-widest font-semibold block mb-1.5">Pseudo</label>
          <input
            type="text"
            placeholder="Ex: Nabila, JeanMichel42…"
            value={username}
            onChange={(e) => setUsername(e.target.value.slice(0, 20))}
            required
            autoFocus
            className="w-full bg-[--bg-input] border border-[--border] rounded-xl px-4 py-2.5 text-[--text] placeholder-[--text-subtle] focus:ring-2 focus:ring-yellow-400/40 transition-all text-sm"
          />
        </div>

        <div>
          <label className="text-[--text-muted] text-xs uppercase tracking-widest font-semibold block mb-1.5">Mot de passe</label>
          <input
            type="password"
            placeholder="Au moins 6 caractères"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-[--bg-input] border border-[--border] rounded-xl px-4 py-2.5 text-[--text] placeholder-[--text-subtle] focus:ring-2 focus:ring-yellow-400/40 transition-all text-sm"
          />
        </div>

        <div>
          <label className="text-[--text-muted] text-xs uppercase tracking-widest font-semibold block mb-1.5">Confirmer le mot de passe</label>
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
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-bold text-sm py-3 rounded-xl transition-colors"
        >
          {loading ? "Création…" : "Créer mon compte"}
        </motion.button>
      </form>
    </main>
  );
}
