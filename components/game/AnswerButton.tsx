"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

type Option = "a" | "b" | "c" | "d";

const OPTION_LABELS: Record<Option, string> = { a: "A", b: "B", c: "C", d: "D" };

interface AnswerButtonProps {
  option: Option;
  text: string;
  onClick: () => void;
  disabled: boolean;
  state: "idle" | "selected" | "revealed-correct" | "revealed-wrong";
}

export function AnswerButton({ option, text, onClick, disabled, state }: AnswerButtonProps) {
  const stateClasses = {
    idle: "bg-white/10 hover:bg-white/20 border-white/10 hover:border-white/25 text-white",
    selected: "bg-white/25 border-white/50 text-white ring-2 ring-white/40",
    "revealed-correct": "bg-green-500/30 border-green-400/60 text-green-300",
    "revealed-wrong": "bg-white/5 border-white/5 text-white/30",
  }[state];

  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      whileHover={{ scale: disabled ? 1 : 1.01 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative flex items-center gap-3 w-full rounded-xl px-4 py-3 font-semibold text-left border",
        "transition-all duration-200 cursor-pointer disabled:cursor-default",
        stateClasses
      )}
    >
      <span className="text-xs font-black opacity-50 w-4 flex-shrink-0">{OPTION_LABELS[option]}</span>
      <span className="text-sm leading-tight break-words flex-1">{text}</span>
      {state === "selected" && <span className="ml-auto text-sm opacity-60">✓</span>}
      {state === "revealed-correct" && <span className="ml-auto text-base">✓</span>}
    </motion.button>
  );
}
