"use client";

import { useCallback, useReducer, useRef } from "react";
import usePartySocket from "partysocket/react";
import type { ClientMessage, ServerMessage, GameSettings } from "@/types/messages";
import type { GameState, PlayerInfo, RevealPayload, ScoreEntry } from "@/types/game";

const DEFAULT_SETTINGS: GameSettings = { totalRounds: 10, roundDurationMs: 10_000 };

const initialState: GameState = {
  phase: "lobby",
  players: [],
  currentQuestion: null,
  myAnswer: null,
  reveal: null,
  scores: [],
  myScore: 0,
  round: 0,
  totalRounds: 0,
  answeredCount: 0,
  hostClientId: null,
  settings: DEFAULT_SETTINGS,
  error: null,
};

type Action =
  | { type: "LOBBY_UPDATE"; players: PlayerInfo[]; hostClientId: string | null; settings: GameSettings }
  | { type: "QUESTION_START"; question: GameState["currentQuestion"] }
  | { type: "ANSWER_CONFIRMED"; option: "a" | "b" | "c" | "d" }
  | { type: "PLAYER_ANSWERED"; answeredCount: number }
  | { type: "ROUND_REVEAL"; reveal: RevealPayload }
  | { type: "GAME_OVER"; finalScores: ScoreEntry[] }
  | { type: "SET_ERROR"; message: string };

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "LOBBY_UPDATE":
      return {
        ...state,
        // If game was finished and we get a lobby update, reset to lobby (restart)
        phase: state.phase === "finished" ? "lobby" : state.phase,
        players: action.players,
        hostClientId: action.hostClientId,
        settings: action.settings,
        scores: action.players.map((p, i) => ({
          clientId: p.clientId,
          pseudonym: p.pseudonym,
          score: p.score,
          pointsThisRound: 0,
          rank: i + 1,
        })),
      };
    case "QUESTION_START":
      return {
        ...state,
        phase: "question",
        currentQuestion: action.question,
        myAnswer: null,
        reveal: null,
        round: action.question?.round ?? state.round,
        totalRounds: action.question?.total ?? state.totalRounds,
        answeredCount: 0,
        error: null,
      };
    case "ANSWER_CONFIRMED":
      return { ...state, myAnswer: action.option };
    case "PLAYER_ANSWERED":
      return { ...state, answeredCount: action.answeredCount };
    case "ROUND_REVEAL":
      return {
        ...state,
        phase: "reveal",
        reveal: action.reveal,
        scores: action.reveal.scores,
      };
    case "GAME_OVER":
      return { ...state, phase: "finished", scores: action.finalScores };
    case "SET_ERROR":
      return { ...state, error: action.message };
    default:
      return state;
  }
}

interface UseGameStateOptions {
  roomCode: string;
  clientId: string;
  pseudonym: string;
  userId?: string;
  host: string;
  onKicked?: () => void;
}

export function useGameState({ roomCode, clientId, pseudonym, userId, host, onKicked }: UseGameStateOptions) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const hasJoined = useRef(false);

  const socket = usePartySocket({
    host,
    room: roomCode,
    onOpen() {
      if (!hasJoined.current) {
        hasJoined.current = true;
        const joinMsg: ClientMessage = { type: "JOIN", pseudonym, userId, clientId };
        socket.send(JSON.stringify(joinMsg));
      }
    },
    onMessage(evt) {
      const msg = JSON.parse(evt.data) as ServerMessage;
      switch (msg.type) {
        case "LOBBY_UPDATE":
          dispatch({ type: "LOBBY_UPDATE", players: msg.players, hostClientId: msg.hostClientId, settings: msg.settings });
          break;
        case "QUESTION_START":
          dispatch({ type: "QUESTION_START", question: msg.question });
          break;
        case "ANSWER_CONFIRMED":
          dispatch({ type: "ANSWER_CONFIRMED", option: msg.option });
          break;
        case "PLAYER_ANSWERED":
          dispatch({ type: "PLAYER_ANSWERED", answeredCount: msg.answeredCount });
          break;
        case "ROUND_REVEAL":
          dispatch({ type: "ROUND_REVEAL", reveal: msg.reveal });
          break;
        case "GAME_OVER":
          dispatch({ type: "GAME_OVER", finalScores: msg.finalScores });
          break;
        case "ERROR":
          dispatch({ type: "SET_ERROR", message: msg.message });
          break;
        case "KICKED":
          onKicked?.();
          break;
      }
    },
  });

  const submitAnswer = useCallback(
    (option: "a" | "b" | "c" | "d") => {
      const msg: ClientMessage = { type: "SUBMIT_ANSWER", option, clientTimestamp: Date.now() };
      socket.send(JSON.stringify(msg));
    },
    [socket]
  );

  const startGame = useCallback(() => {
    socket.send(JSON.stringify({ type: "START_GAME" } satisfies ClientMessage));
  }, [socket]);

  const updateSettings = useCallback(
    (settings: Partial<GameSettings>) => {
      socket.send(JSON.stringify({ type: "SET_SETTINGS", settings } satisfies ClientMessage));
    },
    [socket]
  );

  const kickPlayer = useCallback(
    (targetClientId: string) => {
      socket.send(JSON.stringify({ type: "KICK_PLAYER", clientId: targetClientId } satisfies ClientMessage));
    },
    [socket]
  );

  const restartGame = useCallback(() => {
    socket.send(JSON.stringify({ type: "RESTART_GAME" } satisfies ClientMessage));
  }, [socket]);

  const isHost = state.hostClientId === clientId;
  const myScore = state.scores.find((s) => s.clientId === clientId)?.score ?? 0;
  const myRank = state.scores.find((s) => s.clientId === clientId)?.rank;

  return { state, submitAnswer, startGame, updateSettings, kickPlayer, restartGame, isHost, myScore, myRank, myClientId: clientId };
}
