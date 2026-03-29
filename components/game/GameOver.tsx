"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { ScoreEntry } from "@/types/game";
import type { GameSettings } from "@/types/messages";

interface GameOverProps {
  scores: ScoreEntry[];
  myClientId: string;
  isHost: boolean;
  onRestart: () => void;
  settings: GameSettings;
  onSettingsChange: (settings: Partial<GameSettings>) => void;
}

const medals = ["🥇", "🥈", "🥉"];
const podiumColors = ["text-yellow-400", "text-gray-300", "text-amber-600"];

export function GameOver({ scores, myClientId, isHost, onRestart, settings, onSettingsChange }: GameOverProps) {
  const [showSettings, setShowSettings] = useState(false);
  const sorted = [...scores].sort((a, b) => b.score - a.score);
  const myRank = sorted.findIndex((s) => s.clientId === myClientId) + 1;
  const winner = sorted[0];

  return (
    <div className="flex flex-col items-center gap-6 py-8 px-4 max-w-lg mx-auto text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.2 }}
        className="text-8xl"
      >
        🏆
      </motion.div>

      <div>
        <h1 className="text-3xl font-black text-white">Partie terminée !</h1>
        {winner && (
          <p className="text-white/70 mt-1">
            <span className="text-yellow-400 font-bold">{winner.pseudonym}</span> a gagné avec{" "}
            <span className="font-bold">{winner.score.toLocaleString("fr-FR")} pts</span>
          </p>
        )}
      </div>

      {myRank > 0 && (
        <div className="bg-white/10 rounded-2xl px-6 py-3">
          <p className="text-white/60 text-sm">Ta position</p>
          <p className="text-4xl font-black text-white">#{myRank}</p>
        </div>
      )}

      {/* Podium */}
      <div className="w-full flex flex-col gap-2">
        {sorted.slice(0, 10).map((entry, i) => (
          <motion.div
            key={entry.clientId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
              entry.clientId === myClientId ? "bg-white/20 ring-2 ring-white/60" : "bg-white/10"
            }`}
          >
            <span className={`text-xl font-bold w-8 ${podiumColors[i] ?? "text-white/60"}`}>
              {i < 3 ? medals[i] : `${i + 1}.`}
            </span>
            <span className="flex-1 text-white font-semibold text-left truncate">
              {entry.pseudonym}
              {entry.clientId === myClientId && " (toi)"}
            </span>
            <span className="text-white font-mono font-bold">
              {entry.score.toLocaleString("fr-FR")} pts
            </span>
          </motion.div>
        ))}
      </div>

      {/* Host controls */}
      {isHost && (
        <div className="w-full flex flex-col gap-2">
          {/* Collapsible settings */}
          <button
            onClick={() => setShowSettings((v) => !v)}
            className="text-white/50 text-sm hover:text-white/80 transition-colors flex items-center justify-center gap-1"
          >
            Réglages {showSettings ? "▲" : "▼"}
          </button>

          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-4"
            >
              <div>
                <label className="text-white/60 text-xs uppercase tracking-widest font-semibold block mb-2">
                  Nombre de questions
                </label>
                <div className="flex gap-2 flex-wrap">
                  {[5, 10, 15, 20].map((n) => (
                    <button
                      key={n}
                      onClick={() => onSettingsChange({ totalRounds: n })}
                      className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                        settings.totalRounds === n
                          ? "bg-yellow-400 text-black"
                          : "bg-white/10 text-white hover:bg-white/20"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-white/60 text-xs uppercase tracking-widest font-semibold block mb-2">
                  Durée par question
                </label>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { label: "7s", ms: 7_000 },
                    { label: "10s", ms: 10_000 },
                    { label: "15s", ms: 15_000 },
                    { label: "20s", ms: 20_000 },
                  ].map(({ label, ms }) => (
                    <button
                      key={ms}
                      onClick={() => onSettingsChange({ roundDurationMs: ms })}
                      className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                        settings.roundDurationMs === ms
                          ? "bg-yellow-400 text-black"
                          : "bg-white/10 text-white hover:bg-white/20"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onRestart}
            className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-3 rounded-xl transition-colors"
          >
            🔄 Relancer une partie
          </motion.button>
        </div>
      )}
    </div>
  );
}
