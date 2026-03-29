"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface ActiveRoom {
  id: string;
  code: string;
  status: "waiting" | "playing";
  createdAt: string;
}

export default function HomePage() {
  const router = useRouter();
  const [pseudonym, setPseudonym] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pseudoError, setPseudoError] = useState(false);
  const [activeRooms, setActiveRooms] = useState<ActiveRoom[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("quialaref_pseudonym");
    if (saved) setPseudonym(saved);
    fetchRooms();
    const id = setInterval(fetchRooms, 5000);
    return () => clearInterval(id);
  }, []);

  function fetchRooms() {
    fetch("/api/rooms").then((r) => r.json()).then(setActiveRooms).catch(() => {});
  }

  function savePseudo() {
    if (!pseudonym.trim()) { setPseudoError(true); return false; }
    setPseudoError(false);
    localStorage.setItem("quialaref_pseudonym", pseudonym.trim());
    return true;
  }

  async function handleCreate() {
    if (!savePseudo()) return;
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/rooms", { method: "POST" });
      const data = await res.json();
      router.push(`/room/${data.code}`);
    } catch { setError("Erreur, réessaie."); setLoading(false); }
  }

  async function handleJoin(code?: string) {
    if (!savePseudo()) return;
    const c = (code ?? joinCode).toUpperCase().trim();
    if (!c) { setError("Entre le code !"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/rooms/${c}`);
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "Salon introuvable.");
        setLoading(false);
        return;
      }
      router.push(`/room/${c}`);
    } catch { setError("Erreur réseau."); setLoading(false); }
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">

      {/* Bloc principal */}
      <div className="max-w-md mx-auto mb-10">
        <div className="bg-[--bg-card] border border-[--border] rounded-2xl p-5 shadow-sm">

          {/* Pseudo */}
          <label className="text-[--text-muted] text-xs uppercase tracking-widest font-semibold mb-1.5 block">
            Ton pseudo
          </label>
          <input
            type="text"
            placeholder="Ex: Nabila, JeanMichel42…"
            value={pseudonym}
            onChange={(e) => { setPseudonym(e.target.value.slice(0, 20)); setPseudoError(false); }}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            className={`w-full bg-[--bg-input] border rounded-xl px-4 py-2.5 text-[--text] placeholder-[--text-subtle] focus:ring-2 transition-all text-sm ${
              pseudoError
                ? "border-red-500 focus:ring-red-500/30 focus:border-red-500"
                : "border-[--border] focus:ring-yellow-400/40 focus:border-yellow-400/40"
            }`}
          />
          {pseudoError && (
            <p className="text-red-400 text-xs mt-1 mb-3">Entre un pseudo !</p>
          )}
          {!pseudoError && <div className="mb-4" />}

          {/* Créer */}
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleCreate}
            disabled={loading}
            className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-bold text-sm py-3 rounded-xl transition-colors mb-3"
          >
            {loading ? "…" : "Créer un salon"}
          </motion.button>

          <div className="flex items-center gap-3 my-3">
            <div className="flex-1 h-px bg-[--border]" />
            <span className="text-[--text-subtle] text-xs">ou rejoindre</span>
            <div className="flex-1 h-px bg-[--border]" />
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Code du salon"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              className="flex-1 bg-[--bg-input] border border-[--border] rounded-xl px-4 py-2.5 text-[--text] placeholder-[--text-subtle] uppercase tracking-widest font-mono text-sm focus:ring-2 focus:ring-[--border-hover] transition-all"
            />
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => handleJoin()}
              disabled={loading}
              className="bg-[--bg-input] border border-[--border] hover:border-[--border-hover] disabled:opacity-50 text-[--text] font-semibold text-sm px-5 py-2.5 rounded-xl transition-all"
            >
              Rejoindre
            </motion.button>
          </div>

          {error && <p className="text-red-400 text-xs mt-3">{error}</p>}
        </div>
      </div>

      {/* Salons actifs */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
          <h2 className="text-[--text-muted] text-xs uppercase tracking-widest font-semibold">
            Salons en cours ({activeRooms.length})
          </h2>
        </div>

        {activeRooms.length === 0 ? (
          <div className="bg-[--bg-card] border border-[--border] rounded-xl p-8 text-center">
            <p className="text-[--text-muted] text-sm">Aucun salon en cours — crée le premier !</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeRooms.map((room) => (
              <motion.button
                key={room.id}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => handleJoin(room.code)}
                className="bg-[--bg-card] border border-[--border] hover:border-[--border-hover] rounded-xl p-4 text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-bold text-[--text] text-lg tracking-widest">
                    {room.code}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    room.status === "waiting"
                      ? "bg-green-500/15 text-green-500"
                      : "bg-yellow-500/15 text-yellow-500"
                  }`}>
                    {room.status === "waiting" ? "En attente" : "En cours"}
                  </span>
                </div>
                <p className="text-[--text-muted] text-xs group-hover:text-[--text] transition-colors">
                  Cliquer pour rejoindre →
                </p>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
