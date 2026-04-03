"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { useGameState } from "@/hooks/useGameState";
import { useClientId } from "@/hooks/useClientId";
import { Lobby } from "@/components/game/Lobby";
import { QuestionCard } from "@/components/game/QuestionCard";
import { Scoreboard } from "@/components/game/Scoreboard";
import { GameOver } from "@/components/game/GameOver";

const PARTYKIT_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? "localhost:1999";

export default function RoomPage() {
  const params = useParams<{ code: string }>();
  const code = params.code.toUpperCase();
  const clientId = useClientId();
  const [pseudonym, setPseudonym] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("quialaref_pseudonym");
    setPseudonym(stored ?? "Anonyme");
  }, []);

  if (!clientId || !pseudonym) {
    return (
      <main className="bg-[--bg] flex items-center justify-center min-h-screen">
        <div className="text-white/50 text-lg animate-pulse">Connexion en cours…</div>
      </main>
    );
  }

  return <RoomGame code={code} clientId={clientId} pseudonym={pseudonym} onKicked={() => router.push("/?kicked=1")} />;
}

function RoomGame({ code, clientId, pseudonym, onKicked }: { code: string; clientId: string; pseudonym: string; onKicked: () => void }) {
  const { state, submitAnswer, startGame, updateSettings, kickPlayer, restartGame, nextQuestion, playVideo, isHost, myClientId } = useGameState({
    roomCode: code,
    clientId,
    pseudonym,
    host: PARTYKIT_HOST,
    onKicked,
  });

  const showScoreboard = state.phase !== "lobby" && state.scores.length > 0;
  const inQuestion = state.phase === "question" || state.phase === "reveal";

  return (
    <main className="bg-[--bg] min-h-screen flex">
      {/* Sidebar scores — desktop */}
      {showScoreboard && (
        <aside className="hidden lg:block w-56 p-4 border-r border-white/10 overflow-y-auto">
          <Scoreboard scores={state.scores} myClientId={myClientId} roomCode={code} />
        </aside>
      )}

      <div className="flex-1 flex flex-col items-start justify-start pt-5 px-4 pb-4">
        {/* Header (lobby only) */}
        {state.phase === "lobby" && (
          <div className="w-full max-w-2xl mx-auto flex items-center justify-between mb-3">
            <div>
              <span className="text-white/40 text-xs uppercase tracking-widest">Salon</span>
              <p className="text-white font-mono font-bold text-lg">{code}</p>
            </div>
          </div>
        )}

        <div className="w-full flex flex-col items-center">
          <AnimatePresence mode="wait">
            {state.phase === "lobby" && (
              <Lobby
                key="lobby"
                roomCode={code}
                players={state.players}
                onStart={startGame}
                myClientId={myClientId}
                isHost={isHost}
                settings={state.settings}
                onSettingsChange={updateSettings}
                onKick={kickPlayer}
                error={state.error}
              />
            )}

            {/* Question + Reveal partagent la même clé → pas de remount */}
            {inQuestion && state.currentQuestion && (
              <QuestionCard
                key={`question-${state.round}`}
                question={state.currentQuestion}
                myAnswer={state.myAnswer}
                answeredCount={state.answeredCount}
                totalPlayers={state.players.length}
                onAnswer={submitAnswer}
                reveal={state.phase === "reveal" ? state.reveal : null}
                isHost={isHost}
                autoChange={state.settings.autoChange}
                showVideo={state.showVideo}
                onNextQuestion={nextQuestion}
                onPlayVideo={playVideo}
              />
            )}

            {state.phase === "finished" && (
              <GameOver
                key="gameover"
                scores={state.scores}
                myClientId={myClientId}
                isHost={isHost}
                onRestart={restartGame}
                settings={state.settings}
                onSettingsChange={updateSettings}
              />
            )}
          </AnimatePresence>

          {/* Scoreboard mobile (hors lobby) */}
          {showScoreboard && state.phase !== "finished" && (
            <div className="lg:hidden w-full max-w-2xl mt-4 border-t border-white/10 pt-3">
              <Scoreboard scores={state.scores} myClientId={myClientId} />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
