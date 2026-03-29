"use client";

import { useTimer } from "@/hooks/useTimer";
import { cn } from "@/lib/cn";

interface TimerProps {
  serverTimestamp: number | null;
  durationMs: number;
}

export function Timer({ serverTimestamp, durationMs }: TimerProps) {
  const { progress, seconds } = useTimer(serverTimestamp, durationMs);

  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);
  const color = seconds > 5 ? "#22c55e" : seconds > 3 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative flex items-center justify-center w-14 h-14">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={radius} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="5" />
        <circle
          cx="24" cy="24" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: "stroke-dashoffset 0.1s linear, stroke 0.3s" }}
        />
      </svg>
      <span className={cn("relative z-10 text-lg font-black tabular-nums", seconds <= 3 ? "text-red-400 animate-pulse" : "text-white")}>
        {seconds}
      </span>
    </div>
  );
}
