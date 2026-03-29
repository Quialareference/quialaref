"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

type RefStatus = "pending" | "approved" | "rejected";

interface AdminRef {
  id: string;
  title: string;
  question: string | null;
  correctAnswer: string | null;
  mediaType: "image" | "video";
  mediaUrl: string;
  youtubeUrl: string | null;
  status: RefStatus;
  playCount: number;
  createdAt: string;
  propositions: { text: string }[];
}

const STATUS_LABELS: Record<RefStatus, string> = {
  pending: "En attente",
  approved: "Approuvée",
  rejected: "Rejetée",
};

const STATUS_COLORS: Record<RefStatus, string> = {
  pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  approved: "bg-green-500/20 text-green-300 border-green-500/30",
  rejected: "bg-red-500/20 text-red-300 border-red-500/30",
};

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);
  const [refs, setRefs] = useState<AdminRef[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<RefStatus | "all">("pending");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRefs = useCallback(async (s: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/refs", {
        headers: { "x-admin-secret": s },
      });
      if (res.status === 401) { setError("Mot de passe incorrect."); setAuthed(false); return; }
      const data = await res.json();
      setRefs(data);
      setAuthed(true);
    } catch {
      setError("Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    await fetchRefs(secret);
  }

  async function action(id: string, type: "approve" | "reject" | "pending" | "delete") {
    setActionLoading(id + type);
    try {
      if (type === "delete") {
        await fetch(`/api/admin/refs/${id}`, {
          method: "DELETE",
          headers: { "x-admin-secret": secret },
        });
        setRefs((prev) => prev.filter((r) => r.id !== id));
      } else {
        const status = type === "approve" ? "approved" : type === "reject" ? "rejected" : "pending";
        await fetch(`/api/admin/refs/${id}`, {
          method: "PATCH",
          headers: { "x-admin-secret": secret, "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        setRefs((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
      }
    } finally {
      setActionLoading(null);
    }
  }

  const filtered = filter === "all" ? refs : refs.filter((r) => r.status === filter);
  const counts = {
    pending: refs.filter((r) => r.status === "pending").length,
    approved: refs.filter((r) => r.status === "approved").length,
    rejected: refs.filter((r) => r.status === "rejected").length,
    all: refs.length,
  };

  if (!authed) {
    return (
      <main className="min-h-screen bg-[--bg] flex items-center justify-center px-4">
        <form onSubmit={handleLogin} className="bg-[--bg-card] border border-[--border] rounded-2xl p-8 w-full max-w-sm flex flex-col gap-4">
          <div className="text-center mb-2">
            <p className="text-3xl mb-1">🔐</p>
            <h1 className="text-[--text] font-black text-xl">Admin — Qui a la réf ?</h1>
          </div>
          <input
            type="password"
            placeholder="Mot de passe admin"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="bg-[--bg-input] border border-[--border] rounded-xl px-4 py-3 text-[--text] placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            autoFocus
          />
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading || !secret}
            className="bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-bold py-3 rounded-xl transition-colors"
          >
            {loading ? "Connexion..." : "Accéder"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[--bg] text-[--text]">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black">Admin — Références</h1>
          <button
            onClick={() => fetchRefs(secret)}
            className="text-xs text-white/50 hover:text-white transition-colors border border-white/20 px-3 py-1.5 rounded-lg"
          >
            Rafraîchir
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(["pending", "approved", "rejected", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors border ${
                filter === f
                  ? "bg-yellow-400 text-gray-900 border-yellow-400"
                  : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10"
              }`}
            >
              {f === "all" ? "Toutes" : STATUS_LABELS[f]}
              <span className="ml-2 opacity-60 font-mono">{counts[f]}</span>
            </button>
          ))}
        </div>

        {loading && <p className="text-white/40 text-center py-12">Chargement…</p>}

        <div className="flex flex-col gap-4">
          {filtered.map((ref) => (
            <div key={ref.id} className="bg-[--bg-card] border border-[--border] rounded-2xl overflow-hidden">
              <div className="flex gap-4 p-4">
                {/* Media preview */}
                <div className="flex-shrink-0 w-32 h-24 rounded-xl overflow-hidden bg-black/40 relative">
                  {ref.mediaType === "image" ? (
                    <Image src={ref.mediaUrl} alt={ref.title} fill className="object-cover" />
                  ) : (
                    <video src={ref.mediaUrl} muted playsInline className="w-full h-full object-cover" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h2 className="font-black text-lg truncate">{ref.title}</h2>
                    <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[ref.status]}`}>
                      {STATUS_LABELS[ref.status]}
                    </span>
                  </div>

                  {ref.question && (
                    <p className="text-white/70 text-sm mb-1">
                      <span className="text-white/40">Question : </span>
                      {ref.question.replace("___", "___")}
                      {" → "}
                      <span className="text-yellow-400 font-semibold">{ref.correctAnswer}</span>
                    </p>
                  )}

                  <div className="flex flex-wrap gap-1 mt-2">
                    {ref.propositions.map((p, i) => (
                      <span key={i} className="text-xs bg-white/10 text-white/60 px-2 py-0.5 rounded-lg">{p.text}</span>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 mt-2 text-xs text-white/30">
                    <span>{new Date(ref.createdAt).toLocaleDateString("fr-FR")}</span>
                    <span>{ref.playCount} parties</span>
                    {ref.youtubeUrl && (
                      <a href={ref.youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-red-400 hover:text-red-300 transition-colors">
                        ▶ YouTube
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-white/5 px-4 py-3 flex gap-2 flex-wrap">
                {ref.status !== "approved" && (
                  <button
                    onClick={() => action(ref.id, "approve")}
                    disabled={actionLoading === ref.id + "approve"}
                    className="bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30 text-sm font-semibold px-4 py-1.5 rounded-xl transition-colors disabled:opacity-50"
                  >
                    ✓ Approuver
                  </button>
                )}
                {ref.status !== "rejected" && (
                  <button
                    onClick={() => action(ref.id, "reject")}
                    disabled={actionLoading === ref.id + "reject"}
                    className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-sm font-semibold px-4 py-1.5 rounded-xl transition-colors disabled:opacity-50"
                  >
                    ✗ Rejeter
                  </button>
                )}
                {ref.status !== "pending" && (
                  <button
                    onClick={() => action(ref.id, "pending")}
                    disabled={actionLoading === ref.id + "pending"}
                    className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/30 text-sm font-semibold px-4 py-1.5 rounded-xl transition-colors disabled:opacity-50"
                  >
                    ↺ Remettre en attente
                  </button>
                )}
                <button
                  onClick={() => { if (confirm("Supprimer définitivement cette ref ?")) action(ref.id, "delete"); }}
                  disabled={actionLoading === ref.id + "delete"}
                  className="ml-auto bg-white/5 hover:bg-red-500/20 text-white/30 hover:text-red-300 border border-white/10 hover:border-red-500/30 text-sm px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}

          {!loading && filtered.length === 0 && (
            <p className="text-white/30 text-center py-12">Aucune référence dans cette catégorie.</p>
          )}
        </div>
      </div>
    </main>
  );
}
