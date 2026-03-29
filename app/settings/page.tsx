"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function SettingsPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [usernameMsg, setUsernameMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [emailMsg, setEmailMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
    if (status === "authenticated" && session?.user) {
      setUsername(session.user.username ?? "");
      setEmail(session.user.email ?? "");
    }
  }, [status, session, router]);

  if (status === "loading" || status === "unauthenticated") {
    return <main className="flex items-center justify-center min-h-screen"><div className="text-white/50 animate-pulse">Chargement…</div></main>;
  }

  async function patch(body: object, setMsg: (m: { ok: boolean; text: string }) => void, loadKey: string) {
    setLoading(loadKey);
    setMsg(null as unknown as { ok: boolean; text: string });
    const res = await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setMsg({ ok: res.ok, text: res.ok ? "Mis à jour ✓" : (data.error ?? "Erreur") });
    if (res.ok) await update();
    setLoading(null);
  }

  async function handleDelete() {
    setLoading("delete");
    await fetch("/api/user", { method: "DELETE" });
    await signOut({ callbackUrl: "/" });
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-12">
      <h1 className="text-2xl font-black text-[--text] mb-8">Réglages du compte</h1>

      <div className="flex flex-col gap-6">

        {/* Pseudo */}
        <section className="bg-[--bg-card] border border-[--border] rounded-2xl p-5">
          <h2 className="text-[--text] font-bold mb-4">Pseudo</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.slice(0, 20))}
              className="flex-1 bg-[--bg-input] border border-[--border] rounded-xl px-4 py-2.5 text-[--text] placeholder-[--text-subtle] focus:ring-2 focus:ring-yellow-400/40 transition-all text-sm"
            />
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => patch({ username }, (m) => setUsernameMsg(m), "username")}
              disabled={loading === "username"}
              className="bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-bold px-4 rounded-xl text-sm transition-colors"
            >
              {loading === "username" ? "…" : "Sauvegarder"}
            </motion.button>
          </div>
          {usernameMsg && <p className={`text-xs mt-2 ${usernameMsg.ok ? "text-green-400" : "text-red-400"}`}>{usernameMsg.text}</p>}
        </section>

        {/* Email */}
        <section className="bg-[--bg-card] border border-[--border] rounded-2xl p-5">
          <h2 className="text-[--text] font-bold mb-4">Adresse email</h2>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-[--bg-input] border border-[--border] rounded-xl px-4 py-2.5 text-[--text] placeholder-[--text-subtle] focus:ring-2 focus:ring-yellow-400/40 transition-all text-sm"
            />
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => patch({ email }, (m) => setEmailMsg(m), "email")}
              disabled={loading === "email"}
              className="bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-bold px-4 rounded-xl text-sm transition-colors"
            >
              {loading === "email" ? "…" : "Sauvegarder"}
            </motion.button>
          </div>
          {emailMsg && <p className={`text-xs mt-2 ${emailMsg.ok ? "text-green-400" : "text-red-400"}`}>{emailMsg.text}</p>}
        </section>

        {/* Mot de passe */}
        <section className="bg-[--bg-card] border border-[--border] rounded-2xl p-5">
          <h2 className="text-[--text] font-bold mb-4">Mot de passe</h2>
          <div className="flex flex-col gap-3">
            <input
              type="password"
              placeholder="Mot de passe actuel"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-[--bg-input] border border-[--border] rounded-xl px-4 py-2.5 text-[--text] placeholder-[--text-subtle] focus:ring-2 focus:ring-yellow-400/40 transition-all text-sm"
            />
            <input
              type="password"
              placeholder="Nouveau mot de passe"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-[--bg-input] border border-[--border] rounded-xl px-4 py-2.5 text-[--text] placeholder-[--text-subtle] focus:ring-2 focus:ring-yellow-400/40 transition-all text-sm"
            />
            <input
              type="password"
              placeholder="Confirmer le nouveau mot de passe"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-[--bg-input] border border-[--border] rounded-xl px-4 py-2.5 text-[--text] placeholder-[--text-subtle] focus:ring-2 focus:ring-yellow-400/40 transition-all text-sm"
            />
            {passwordMsg && <p className={`text-xs ${passwordMsg.ok ? "text-green-400" : "text-red-400"}`}>{passwordMsg.text}</p>}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                if (newPassword !== confirmPassword) { setPasswordMsg({ ok: false, text: "Les mots de passe ne correspondent pas." }); return; }
                patch({ password: newPassword, currentPassword }, (m) => setPasswordMsg(m), "password");
              }}
              disabled={loading === "password"}
              className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-bold py-2.5 rounded-xl text-sm transition-colors"
            >
              {loading === "password" ? "…" : "Changer le mot de passe"}
            </motion.button>
          </div>
        </section>

        {/* Supprimer le compte */}
        <section className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5">
          <h2 className="text-red-400 font-bold mb-2">Supprimer le compte</h2>
          <p className="text-[--text-muted] text-sm mb-4">Cette action est irréversible. Toutes tes données seront supprimées.</p>
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-red-400 border border-red-500/30 hover:bg-red-500/10 font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
            >
              Supprimer mon compte
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 bg-white/10 hover:bg-white/20 text-[--text] font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={loading === "delete"}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
              >
                {loading === "delete" ? "…" : "Confirmer la suppression"}
              </button>
            </div>
          )}
        </section>

        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-[--text-muted] hover:text-[--text] text-sm text-center transition-colors"
        >
          Se déconnecter
        </button>

      </div>
    </main>
  );
}
