import type { PlayerInfo, QuestionPayload, RevealPayload, ScoreEntry } from "./game";

export interface GameSettings {
  totalRounds: number;
  roundDurationMs: number;
}

// Client → Server
export type ClientMessage =
  | { type: "JOIN"; pseudonym: string; userId?: string; clientId: string }
  | { type: "START_GAME" }
  | { type: "RESTART_GAME" }
  | { type: "SUBMIT_ANSWER"; option: "a" | "b" | "c" | "d"; clientTimestamp: number }
  | { type: "SET_SETTINGS"; settings: Partial<GameSettings> }
  | { type: "KICK_PLAYER"; clientId: string };

// Server → Client
export type ServerMessage =
  | { type: "LOBBY_UPDATE"; players: PlayerInfo[]; hostClientId: string | null; settings: GameSettings }
  | { type: "QUESTION_START"; question: QuestionPayload }
  | { type: "ANSWER_CONFIRMED"; option: "a" | "b" | "c" | "d" }
  | { type: "PLAYER_ANSWERED"; clientId: string; answeredCount: number; totalPlayers: number }
  | { type: "ROUND_REVEAL"; reveal: RevealPayload }
  | { type: "GAME_OVER"; finalScores: ScoreEntry[] }
  | { type: "ERROR"; message: string }
  | { type: "KICKED" };
