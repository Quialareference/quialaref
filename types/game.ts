import type { GameSettings } from "./messages";

export type { GameSettings };

export type GamePhase = "lobby" | "question" | "reveal" | "finished";

export interface PlayerInfo {
  clientId: string;
  pseudonym: string;
  score: number;
  answered: boolean;
  userId?: string;
}

export interface ScoreEntry {
  clientId: string;
  pseudonym: string;
  score: number;
  pointsThisRound: number;
  rank: number;
}

export interface QuestionPayload {
  round: number;
  total: number;
  mediaUrl: string;
  mediaType: "image" | "video";
  thumbnailUrl?: string;
  question: string; // Sentence with ___ placeholder
  options: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  serverTimestamp: number;
  durationMs: number;
  youtubeUrl?: string | null;
}

export interface RevealPayload {
  correctOption: "a" | "b" | "c" | "d";
  correctText: string;
  submittedBy: string | null;
  scores: ScoreEntry[];
  pointsThisRound: Record<string, number>;
}

export interface GameState {
  phase: GamePhase;
  players: PlayerInfo[];
  currentQuestion: QuestionPayload | null;
  myAnswer: "a" | "b" | "c" | "d" | null;
  reveal: RevealPayload | null;
  scores: ScoreEntry[];
  myScore: number;
  round: number;
  totalRounds: number;
  answeredCount: number;
  hostClientId: string | null;
  settings: GameSettings;
  showVideo: boolean;
  error: string | null;
}
