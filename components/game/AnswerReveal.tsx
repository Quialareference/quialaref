"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { AnswerButton } from "./AnswerButton";
import type { QuestionPayload, RevealPayload } from "@/types/game";

type Option = "a" | "b" | "c" | "d";
const OPTIONS: Option[] = ["a", "b", "c", "d"];

interface AnswerRevealProps {
  question: QuestionPayload;
  reveal: RevealPayload;
  myAnswer: Option | null;
}

export function AnswerReveal({ question, reveal, myAnswer }: AnswerRevealProps) {
  const isCorrect = myAnswer === reveal.correctOption;

  function getButtonState(option: Option) {
    if (option === reveal.correctOption) return "revealed-correct";
    if (option === myAnswer && option !== reveal.correctOption) return "revealed-wrong";
    return "revealed-wrong";
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col gap-4 w-full max-w-2xl mx-auto"
    >
      {/* Result banner */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`rounded-2xl p-4 text-center font-black text-2xl shadow-lg ${
          myAnswer === null
            ? "bg-gray-600 text-white"
            : isCorrect
            ? "bg-game-green text-white"
            : "bg-game-red text-white"
        }`}
      >
        {myAnswer === null
          ? "⏱️ Trop lent !"
          : isCorrect
          ? "✅ Bonne réponse !"
          : "❌ Raté !"}
      </motion.div>

      {/* Media */}
      <div className="relative rounded-2xl overflow-hidden bg-black/40 aspect-video">
        {question.mediaType === "image" ? (
          <Image src={question.mediaUrl} alt="Référence" fill className="object-contain" />
        ) : (
          <video
            src={question.mediaUrl}
            muted
            playsInline
            loop
            autoPlay
            className="w-full h-full object-contain"
          />
        )}
      </div>

      {/* Correct answer label */}
      <div className="bg-white/5 rounded-xl px-4 py-3 text-center">
        <p className="text-white font-semibold text-base leading-snug">
          {question.question.split("___").map((part, i, arr) => (
            <span key={i}>
              {part}
              {i < arr.length - 1 && (
                <span className="inline-block bg-yellow-400/30 text-yellow-300 rounded px-2 mx-1 font-bold">
                  {reveal.correctText}
                </span>
              )}
            </span>
          ))}
        </p>
        {reveal.submittedBy && (
          <p className="text-white/40 text-xs mt-2">
            Soumise par <span className="text-white/60 font-semibold">{reveal.submittedBy}</span>
          </p>
        )}
      </div>

      {/* Buttons (frozen, showing result) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {OPTIONS.map((option) => (
          <AnswerButton
            key={option}
            option={option}
            text={question.options[option]}
            onClick={() => {}}
            disabled={true}
            state={getButtonState(option)}
          />
        ))}
      </div>
    </motion.div>
  );
}
