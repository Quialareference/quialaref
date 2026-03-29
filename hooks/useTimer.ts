"use client";

import { useEffect, useRef, useState } from "react";

export function useTimer(serverTimestamp: number | null, durationMs: number) {
  const [timeLeft, setTimeLeft] = useState(durationMs);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (serverTimestamp === null) {
      setTimeLeft(durationMs);
      return;
    }

    function tick() {
      const elapsed = Date.now() - serverTimestamp!;
      const remaining = Math.max(0, durationMs - elapsed);
      setTimeLeft(remaining);
      if (remaining > 0) {
        frameRef.current = requestAnimationFrame(tick);
      }
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [serverTimestamp, durationMs]);

  const progress = timeLeft / durationMs;
  const seconds = Math.ceil(timeLeft / 1000);

  return { timeLeft, progress, seconds };
}
