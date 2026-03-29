"use client";

import { motion } from "framer-motion";
import type { PlayerInfo, GameSettings } from "@/types/game";

interface LobbyProps {
  roomCode: string;
  players: PlayerInfo[];
  onStart: () => void;
  myClientId: string;
  isHost: boolean;
  settings: GameSettings;
  onSettingsChange: (s: Partial<GameSettings>) => void;
  onKick: (clientId: string) => void;
  error?: string | null;
}

const ROUND_OPTIONS = [5, 10, 15, 20];
const DURATION_OPTIONS = [{ label: "5s", value: 5_000 }, { label: "10s", value: 10_000 }, { label: "15s", value: 15_000 }, { label: "20s", value: 20_000 }];
const medals = ["🥇", "🥈", "🥉"];

export function Lobby({ roomCode, players, onStart, myClientId, isHost, settings, onSettingsChange, onKick, error }: LobbyProps) {
  return (
    <div className="flex flex-col gap-5 w-full max-w-lg mx-auto py-4 px-2 text-[--text]">
      {/* Code */}
      <div className="text-center">
        <p className="text-white/50 text-xs uppercase tracking-widest mb-1">Code du salon</p>
        <div className="bg-white/10 rounded-2xl px-8 py-3 font-black text-4xl tracking-[0.15em] text-white inline-block">
          {roomCode}
        </div>
        <p className="text-white/30 text-xs mt-1">Partage ce code pour inviter des amis</p>
      </div>

      {/* Players scoreboard */}
      <div className="bg-[--bg-card] rounded-2xl border border-[--border] overflow-hidden">
        <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between">
          <span className="text-white/50 text-xs uppercase tracking-widest font-semibold">Joueurs</span>
          <span className="text-white/40 text-xs">{players.length} connecté{players.length > 1 ? "s" : ""}</span>
        </div>
        <div className="divide-y divide-white/5">
          {players.length === 0 && (
            <p className="text-white/30 text-sm text-center py-4">En attente de joueurs…</p>
          )}
          {players.map((p, i) => (
            <motion.div
              key={p.clientId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 px-4 py-3"
            >
              <span className="w-6 text-center text-base">{i < 3 ? medals[i] : `${i + 1}.`}</span>
              <span className={`flex-1 font-semibold truncate ${p.clientId === myClientId ? "text-yellow-300" : "text-white"}`}>
                {p.pseudonym}
                {p.clientId === myClientId && " (toi)"}
                {p.clientId === players[0]?.clientId && " 👑"}
              </span>
              <span className="text-white/40 font-mono text-sm">0 pts</span>
              {isHost && p.clientId !== myClientId && (
                <button
                  onClick={() => onKick(p.clientId)}
                  className="text-red-400/60 hover:text-red-400 text-xs ml-1 transition-colors"
                  title="Exclure"
                >
                  ✕
                </button>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Settings (host only) */}
      {isHost && (
        <div className="bg-[--bg-card] rounded-2xl border border-[--border] p-4">
          <p className="text-white/50 text-xs uppercase tracking-widest font-semibold mb-3">Réglages 👑</p>
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-white/70 text-sm mb-2">Nombre de questions</p>
              <div className="flex gap-2">
                {ROUND_OPTIONS.map((n) => (
                  <button
                    key={n}
                    onClick={() => onSettingsChange({ totalRounds: n })}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${
                      settings.totalRounds === n
                        ? "bg-yellow-400 text-gray-900"
                        : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-white/70 text-sm mb-2">Durée par question</p>
              <div className="flex gap-2">
                {DURATION_OPTIONS.map(({ label, value }) => (
                  <button
                    key={value}
                    onClick={() => onSettingsChange({ roundDurationMs: value })}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${
                      settings.roundDurationMs === value
                        ? "bg-yellow-400 text-gray-900"
                        : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {!isHost && (
        <p className="text-white/30 text-sm text-center">
          En attente que l&apos;hôte lance la partie…
        </p>
      )}

      {error && (
        <div className="bg-red-500/20 border border-red-500/40 rounded-xl px-4 py-3 text-red-300 text-sm text-center">
          {error}
        </div>
      )}

      {isHost && (
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onStart}
          disabled={players.length < 1}
          className="w-full bg-white text-gray-900 font-black text-xl py-4 rounded-2xl shadow-lg hover:bg-yellow-300 transition-colors disabled:opacity-40"
        >
          🎮 Lancer la partie !
        </motion.button>
      )}
    </div>
  );
}
