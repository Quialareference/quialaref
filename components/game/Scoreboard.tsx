"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { ScoreEntry } from "@/types/game";
import { cn } from "@/lib/cn";

interface ScoreboardProps {
  scores: ScoreEntry[];
  myClientId: string;
  className?: string;
  roomCode?: string;
}

const medals = ["🥇", "🥈", "🥉"];

export function Scoreboard({ scores, myClientId, className, roomCode }: ScoreboardProps) {
  const sorted = [...scores].sort((a, b) => b.score - a.score);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {roomCode && (
        <div className="mb-1">
          <p className="text-[10px] text-white/40 uppercase tracking-widest">Salon</p>
          <p className="font-black text-white text-lg tracking-widest">{roomCode}</p>
        </div>
      )}
      <h2 className="text-xs font-bold uppercase tracking-widest text-white/60 mb-1">Scores</h2>
      <AnimatePresence mode="popLayout">
        {sorted.map((entry, i) => {
          const isMe = entry.clientId === myClientId;
          return (
            <motion.div
              key={entry.clientId}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2 text-sm",
                isMe
                  ? "bg-white/20 ring-2 ring-white/60 font-bold"
                  : "bg-white/10"
              )}
            >
              <span className="text-base w-6 text-center">
                {i < 3 ? medals[i] : `${i + 1}.`}
              </span>
              <span className="flex-1 truncate text-white">{entry.pseudonym}</span>
              <motion.span
                key={entry.score}
                initial={{ scale: 1.4, color: "#fbbf24" }}
                animate={{ scale: 1, color: "#ffffff" }}
                className="font-mono font-bold text-white tabular-nums"
              >
                {entry.score.toLocaleString("fr-FR")}
              </motion.span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
