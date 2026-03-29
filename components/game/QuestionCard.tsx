"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Timer } from "./Timer";
import { AnswerButton } from "./AnswerButton";
import type { QuestionPayload, RevealPayload } from "@/types/game";

type Option = "a" | "b" | "c" | "d";
const OPTIONS: Option[] = ["a", "b", "c", "d"];

interface QuestionCardProps {
  question: QuestionPayload;
  myAnswer: Option | null;
  answeredCount: number;
  totalPlayers: number;
  onAnswer: (option: Option) => void;
  reveal: RevealPayload | null;
}

export function QuestionCard({ question, myAnswer, answeredCount, totalPlayers, onAnswer, reveal }: QuestionCardProps) {
  const isReveal = reveal !== null;
  const isCorrect = myAnswer !== null && myAnswer === reveal?.correctOption;

  function getButtonState(option: Option) {
    if (!isReveal) {
      return myAnswer === option ? "selected" : "idle";
    }
    if (option === reveal!.correctOption) return "revealed-correct";
    if (option === myAnswer) return "revealed-wrong";
    return "revealed-wrong";
  }

  const resultMessage = isReveal
    ? myAnswer === null
      ? { text: "⏱️ Trop lent !", color: "text-white/60" }
      : isCorrect
      ? { text: "✅ Bonne réponse !", color: "text-green-400" }
      : { text: "❌ Raté !", color: "text-red-400" }
    : null;

  return (
    <motion.div
      key={question.round}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="flex flex-col gap-2 w-full max-w-2xl mx-auto"
    >
      {/* Header: question counter | timer or result | answered */}
      <div className="flex items-center justify-between">
        <span className="text-white/60 text-sm font-medium">
          Question {question.round}/{question.total}
        </span>

        {/* Fixed-size container so nothing shifts when timer → message */}
        <div className="h-14 w-40 flex items-center justify-center flex-shrink-0">
          <AnimatePresence mode="wait">
            {isReveal ? (
              <motion.span
                key="result"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className={`font-black text-sm whitespace-nowrap ${resultMessage!.color}`}
              >
                {resultMessage!.text}
              </motion.span>
            ) : (
              <motion.div key="timer" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Timer serverTimestamp={question.serverTimestamp} durationMs={question.durationMs} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <span className="text-white/40 text-xs font-medium w-24 text-right">
          {isReveal
            ? <span className="text-white/40">{answeredCount}/{totalPlayers} ont répondu</span>
            : myAnswer
            ? <span className="text-white/60">Réponse envoyée</span>
            : <span>–</span>
          }
        </span>
      </div>

      {/* Question sentence */}
      <div className="bg-white/5 rounded-xl px-4 py-2.5 text-center mt-1 mb-1">
        <p className="text-white font-semibold text-base leading-snug">
          {question.question.split("___").map((part, i, arr) => (
            <span key={i}>
              {part}
              {i < arr.length - 1 && (
                isReveal
                  ? <span className="inline-block bg-yellow-400/30 text-yellow-300 rounded px-2 mx-1 font-bold">{reveal!.correctText}</span>
                  : <span className="inline-block bg-white/20 text-white/60 rounded px-3 mx-1 font-black">___</span>
              )}
            </span>
          ))}
        </p>
      </div>

      {/* Media */}
      <div className="relative rounded-xl overflow-hidden bg-black/40 shadow-xl mb-1" style={{ maxHeight: "34vh" }}>
        {question.mediaType === "image" ? (
          <Image
            src={question.mediaUrl}
            alt="Référence"
            width={800}
            height={400}
            className="w-full object-contain"
            style={{ maxHeight: "34vh" }}
            priority
          />
        ) : (
          <video
            src={question.mediaUrl}
            autoPlay
            muted
            playsInline
            loop
            className="w-full object-contain"
            style={{ maxHeight: "34vh" }}
            poster={question.thumbnailUrl}
          />
        )}
      </div>

      {/* Answer buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {OPTIONS.map((option) => (
          <AnswerButton
            key={option}
            option={option}
            text={question.options[option]}
            onClick={() => !isReveal && onAnswer(option)}
            disabled={isReveal}
            state={getButtonState(option)}
          />
        ))}
      </div>

      {!isReveal && myAnswer && (
        <p className="text-center text-white/40 text-xs">
          Tu peux encore changer — <span className="text-white/60">{question.options[myAnswer]}</span>
        </p>
      )}
    </motion.div>
  );
}
