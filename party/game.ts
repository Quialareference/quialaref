import type * as Party from "partykit/server";
import { calculatePoints } from "../lib/scoring";
import { buildQuestionOptions } from "../lib/proposition-selector";
import type { ClientMessage, ServerMessage, GameSettings } from "../types/messages";
import type { PlayerInfo, ScoreEntry, RevealPayload } from "../types/game";

interface RefData {
  id: string;
  title: string;
  question: string | null;
  correctAnswer: string | null;
  mediaType: "image" | "video";
  mediaUrl: string;
  thumbnailUrl?: string | null;
  submittedByUsername?: string | null;
  propositions: { text: string }[];
}

interface PlayerState {
  clientId: string;
  pseudonym: string;
  userId?: string;
  score: number;
  connectionId: string;
  // Current round answer (reset each round)
  currentAnswer: "a" | "b" | "c" | "d" | null;
  currentPoints: number;
}

interface RoundRecord {
  refId: string;
  roundNumber: number;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: "a" | "b" | "c" | "d";
}

type GamePhase = "lobby" | "question" | "reveal" | "finished";

const DEFAULT_SETTINGS: GameSettings = {
  totalRounds: 10,
  roundDurationMs: 10_000,
};

const REVEAL_DELAY_MS = 4_000;

interface GameRoomState {
  roomId: string | null;
  phase: GamePhase;
  hostClientId: string | null;
  settings: GameSettings;
  players: Map<string, PlayerState>;
  connections: Map<string, string>;
  refQueue: RefData[];
  currentRef: RefData | null;
  currentOptions: { a: string; b: string; c: string; d: string } | null;
  correctOption: "a" | "b" | "c" | "d" | null;
  currentRound: number;
  roundStartTime: number;
  correctAnswerRank: number; // How many players have answered correctly so far this round
  roundTimer: ReturnType<typeof setTimeout> | null;
  roundRecords: RoundRecord[];
}

export default class GameRoom implements Party.Server {
  private state: GameRoomState = {
    roomId: null,
    phase: "lobby",
    hostClientId: null,
    settings: { ...DEFAULT_SETTINGS },
    players: new Map(),
    connections: new Map(),
    refQueue: [],
    currentRef: null,
    currentOptions: null,
    correctOption: null,
    currentRound: 0,
    roundStartTime: 0,
    correctAnswerRank: 0,
    roundTimer: null,
    roundRecords: [],
  };

  constructor(readonly room: Party.Room) {}

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private broadcast(msg: ServerMessage, exclude?: string) {
    const data = JSON.stringify(msg);
    for (const conn of this.room.getConnections()) {
      if (conn.id !== exclude) conn.send(data);
    }
  }

  private send(connectionId: string, msg: ServerMessage) {
    this.room.getConnection(connectionId)?.send(JSON.stringify(msg));
  }

  private broadcastLobby() {
    this.broadcast({
      type: "LOBBY_UPDATE",
      players: this.getPlayerInfos(),
      hostClientId: this.state.hostClientId,
      settings: this.state.settings,
    });
  }

  private getPlayerInfos(): PlayerInfo[] {
    return Array.from(this.state.players.values())
      .map((p) => ({
        clientId: p.clientId,
        pseudonym: p.pseudonym,
        score: p.score,
        answered: p.currentAnswer !== null,
      }))
      .sort((a, b) => b.score - a.score);
  }

  private getScoreEntries(pointsThisRound: Record<string, number> = {}): ScoreEntry[] {
    return Array.from(this.state.players.values())
      .sort((a, b) => b.score - a.score)
      .map((p, i) => ({
        clientId: p.clientId,
        pseudonym: p.pseudonym,
        score: p.score,
        pointsThisRound: pointsThisRound[p.clientId] ?? 0,
        rank: i + 1,
      }));
  }

  // ─── Connection lifecycle ────────────────────────────────────────────────────

  onConnect(conn: Party.Connection) {
    conn.send(JSON.stringify({
      type: "LOBBY_UPDATE",
      players: this.getPlayerInfos(),
      hostClientId: this.state.hostClientId,
      settings: this.state.settings,
    }));
  }

  onClose(conn: Party.Connection) {
    const clientId = this.state.connections.get(conn.id);
    if (!clientId) return;
    this.state.connections.delete(conn.id);

    const player = this.state.players.get(clientId);
    if (!player) return;

    if (this.state.phase === "lobby") {
      // En lobby : retrait immédiat
      this.removePlayer(clientId);
    } else {
      // En jeu : 30s de grâce pour reconnexion
      player.connectionId = "";
      this.broadcastLobby();

      setTimeout(() => {
        const p = this.state.players.get(clientId);
        if (p && !p.connectionId) {
          this.removePlayer(clientId);
        }
      }, 30_000);
    }
  }

  private removePlayer(clientId: string) {
    this.state.players.delete(clientId);

    // Si c'était l'hôte, passer le rôle à un joueur connecté aléatoire
    if (this.state.hostClientId === clientId) {
      const connected = Array.from(this.state.players.values()).filter((p) => p.connectionId);
      const next = connected[Math.floor(Math.random() * connected.length)];
      this.state.hostClientId = next?.clientId ?? null;
    }

    // Plus personne → fermer le salon
    if (this.state.players.size === 0) {
      this.closeRoom();
      return;
    }

    this.broadcastLobby();
  }

  private closeRoom() {
    if (this.state.roundTimer) clearTimeout(this.state.roundTimer);

    const baseUrl = (this.room.env.NEXTJS_URL as string) ?? "http://localhost:3000";
    fetch(`${baseUrl}/api/rooms/${this.room.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "finished" }),
    }).catch(() => {});
  }

  // ─── Messages ────────────────────────────────────────────────────────────────

  onMessage(raw: string | ArrayBuffer, conn: Party.Connection) {
    const msg = JSON.parse(typeof raw === "string" ? raw : new TextDecoder().decode(raw)) as ClientMessage;

    if (msg.type === "JOIN") {
      this.handleJoin(conn, msg.clientId, msg.pseudonym, msg.userId);
      return;
    }

    const clientId = this.state.connections.get(conn.id);
    if (!clientId) return;

    switch (msg.type) {
      case "START_GAME":
        if (clientId === this.state.hostClientId) this.handleStartGame();
        break;
      case "SUBMIT_ANSWER":
        this.handleAnswer(clientId, msg.option, msg.clientTimestamp);
        break;
      case "SET_SETTINGS":
        if (clientId === this.state.hostClientId && this.state.phase === "lobby") {
          this.state.settings = { ...this.state.settings, ...msg.settings };
          this.broadcastLobby();
        }
        break;
      case "KICK_PLAYER":
        if (clientId === this.state.hostClientId && msg.clientId !== clientId) {
          this.kickPlayer(msg.clientId);
        }
        break;
      case "RESTART_GAME":
        if (clientId === this.state.hostClientId) this.handleRestartGame();
        break;
    }
  }

  // ─── Game Logic ──────────────────────────────────────────────────────────────

  private handleJoin(conn: Party.Connection, clientId: string, pseudonym: string, userId?: string) {
    // Reconnection
    const existing = this.state.players.get(clientId);
    if (existing) {
      existing.connectionId = conn.id;
      this.state.connections.set(conn.id, clientId);
      conn.send(JSON.stringify({
        type: "LOBBY_UPDATE",
        players: this.getPlayerInfos(),
        hostClientId: this.state.hostClientId,
        settings: this.state.settings,
      }));
      if (this.state.phase === "question" && this.state.currentRef && this.state.currentOptions) {
        conn.send(JSON.stringify({
          type: "QUESTION_START",
          question: {
            round: this.state.currentRound,
            total: this.state.settings.totalRounds,
            mediaUrl: this.state.currentRef.mediaUrl,
            mediaType: this.state.currentRef.mediaType,
            thumbnailUrl: this.state.currentRef.thumbnailUrl,
            question: this.state.currentRef.question ?? "Quelle est cette référence ?",
            options: this.state.currentOptions,
            serverTimestamp: this.state.roundStartTime,
            durationMs: this.state.settings.roundDurationMs,
          },
        }));
      }
      return;
    }

    const player: PlayerState = {
      clientId,
      pseudonym: pseudonym.slice(0, 20),
      userId,
      score: 0,
      connectionId: conn.id,
      currentAnswer: null,
      currentPoints: 0,
    };

    this.state.players.set(clientId, player);
    this.state.connections.set(conn.id, clientId);

    // First player = host
    if (!this.state.hostClientId) {
      this.state.hostClientId = clientId;
    }

    this.broadcastLobby();

    // If game is already running, send current question
    if (this.state.phase === "question" && this.state.currentRef && this.state.currentOptions) {
      conn.send(JSON.stringify({
        type: "QUESTION_START",
        question: {
          round: this.state.currentRound,
          total: this.state.settings.totalRounds,
          mediaUrl: this.state.currentRef.mediaUrl,
          mediaType: this.state.currentRef.mediaType,
          thumbnailUrl: this.state.currentRef.thumbnailUrl,
          question: this.state.currentRef.question ?? "Quelle est cette référence ?",
          options: this.state.currentOptions,
          serverTimestamp: this.state.roundStartTime,
          durationMs: this.state.settings.roundDurationMs,
        },
      }));
    }
  }

  private kickPlayer(targetClientId: string) {
    const player = this.state.players.get(targetClientId);
    if (!player) return;
    if (player.connectionId) {
      this.send(player.connectionId, { type: "KICKED" });
    }
    this.state.players.delete(targetClientId);
    this.broadcastLobby();
  }

  private handleRestartGame() {
    if (this.state.phase !== "finished") return;

    if (this.state.roundTimer) clearTimeout(this.state.roundTimer);

    // Reset all scores and per-round state
    for (const player of this.state.players.values()) {
      player.score = 0;
      player.currentAnswer = null;
      player.currentPoints = 0;
    }

    this.state.phase = "lobby";
    this.state.refQueue = [];
    this.state.currentRef = null;
    this.state.currentOptions = null;
    this.state.correctOption = null;
    this.state.currentRound = 0;
    this.state.correctAnswerRank = 0;
    this.state.roundRecords = [];
    this.state.roundTimer = null;

    const baseUrl = (this.room.env.NEXTJS_URL as string) ?? "http://localhost:3000";
    fetch(`${baseUrl}/api/rooms/${this.room.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "waiting" }),
    }).catch(() => {});

    this.broadcastLobby();
  }

  private async handleStartGame() {
    if (this.state.phase !== "lobby") return;
    if (this.state.players.size < 1) return;

    try {
      const baseUrl = (this.room.env.NEXTJS_URL as string) ?? "http://localhost:3000";
      const limit = this.state.settings.totalRounds;
      const res = await fetch(`${baseUrl}/api/refs?limit=${limit}`);
      const data = (await res.json()) as RefData[];

      if (!data || data.length === 0) {
        this.broadcast({ type: "ERROR", message: "Pas assez de références approuvées pour jouer !" });
        return;
      }

      this.state.refQueue = data;
      this.state.settings.totalRounds = data.length;
      this.state.currentRound = 0;
      this.state.roundRecords = [];

      fetch(`${baseUrl}/api/rooms/${this.room.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "playing" }),
      }).catch(() => {});

      await this.startNextRound();
    } catch (err) {
      console.error("[PartyKit] handleStartGame error:", err);
      this.broadcast({ type: "ERROR", message: "Erreur lors du chargement des références" });
    }
  }

  private async startNextRound() {
    const ref = this.state.refQueue.shift();
    if (!ref) {
      await this.endGame();
      return;
    }

    this.state.phase = "question";
    this.state.currentRound++;
    this.state.currentRef = ref;

    // Reset per-round state
    this.state.correctAnswerRank = 0;
    for (const player of this.state.players.values()) {
      player.currentAnswer = null;
      player.currentPoints = 0;
    }

    const correctAnswer = ref.correctAnswer ?? ref.title;
    const question = ref.question ?? `Quelle est cette référence ?`;
    const falseProps = ref.propositions.map((p) => p.text);
    const { options, correctOption } = buildQuestionOptions(correctAnswer, falseProps);

    this.state.currentOptions = options;
    this.state.correctOption = correctOption;
    this.state.roundStartTime = Date.now();

    this.state.roundRecords.push({
      refId: ref.id,
      roundNumber: this.state.currentRound,
      optionA: options.a,
      optionB: options.b,
      optionC: options.c,
      optionD: options.d,
      correctOption,
    });

    this.broadcast({
      type: "QUESTION_START",
      question: {
        round: this.state.currentRound,
        total: this.state.settings.totalRounds,
        mediaUrl: ref.mediaUrl,
        mediaType: ref.mediaType,
        thumbnailUrl: ref.thumbnailUrl ?? undefined,
        question,
        options,
        serverTimestamp: this.state.roundStartTime,
        durationMs: this.state.settings.roundDurationMs,
      },
    });

    if (this.state.roundTimer) clearTimeout(this.state.roundTimer);
    this.state.roundTimer = setTimeout(() => {
      this.revealAnswer();
    }, this.state.settings.roundDurationMs);
  }

  private handleAnswer(clientId: string, option: "a" | "b" | "c" | "d", clientTimestamp: number) {
    if (this.state.phase !== "question") return;
    const player = this.state.players.get(clientId);
    if (!player) return;

    const wasAnswered = player.currentAnswer !== null;
    const wasCorrectBefore = wasAnswered && player.currentAnswer === this.state.correctOption;
    player.currentAnswer = option;

    const isCorrect = option === this.state.correctOption;

    // Assign rank only when player answers correctly for the first time
    if (isCorrect && !wasCorrectBefore) {
      this.state.correctAnswerRank++;
      player.currentPoints = calculatePoints(this.state.correctAnswerRank, true);
    } else if (!isCorrect) {
      player.currentPoints = 0;
    }
    // If they were already correct and re-select correct: keep points

    // Confirm to player
    if (player.connectionId) {
      this.send(player.connectionId, { type: "ANSWER_CONFIRMED", option });
    }

    // Only broadcast "answered" event on first answer (not on change)
    if (!wasAnswered) {
      const answeredCount = Array.from(this.state.players.values()).filter((p) => p.currentAnswer !== null).length;
      this.broadcast({ type: "PLAYER_ANSWERED", clientId, answeredCount, totalPlayers: this.state.players.size });

      // If everyone answered, reveal immediately
      if (answeredCount === this.state.players.size) {
        if (this.state.roundTimer) clearTimeout(this.state.roundTimer);
        this.revealAnswer();
      }
    }
  }

  private revealAnswer() {
    if (this.state.phase !== "question") return;
    this.state.phase = "reveal";

    if (this.state.roundTimer) {
      clearTimeout(this.state.roundTimer);
      this.state.roundTimer = null;
    }

    // Apply points to scores
    const pointsThisRound: Record<string, number> = {};
    for (const player of this.state.players.values()) {
      player.score += player.currentPoints;
      pointsThisRound[player.clientId] = player.currentPoints;
    }

    const scores = this.getScoreEntries(pointsThisRound);
    const reveal: RevealPayload = {
      correctOption: this.state.correctOption!,
      correctText: this.state.currentOptions![this.state.correctOption!],
      submittedBy: this.state.currentRef?.submittedByUsername ?? null,
      scores,
      pointsThisRound,
    };

    this.broadcast({ type: "ROUND_REVEAL", reveal });

    setTimeout(() => {
      if (this.state.refQueue.length > 0) {
        this.startNextRound();
      } else {
        this.endGame();
      }
    }, REVEAL_DELAY_MS);
  }

  private async endGame() {
    this.state.phase = "finished";
    const finalScores = this.getScoreEntries();
    this.broadcast({ type: "GAME_OVER", finalScores });

    try {
      const baseUrl = (this.room.env.NEXTJS_URL as string) ?? "http://localhost:3000";
      const players = Array.from(this.state.players.values()).map((p) => ({
        pseudonym: p.pseudonym,
        userId: p.userId,
        score: p.score,
        rank: finalScores.find((s) => s.clientId === p.clientId)?.rank ?? 1,
      }));
      await fetch(`${baseUrl}/api/rooms/${this.room.id}/results`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ players, rounds: this.state.roundRecords }),
      });
    } catch {}
  }

  async onRequest(req: Party.Request): Promise<Response> {
    if (req.method === "GET") {
      return Response.json({ phase: this.state.phase, playerCount: this.state.players.size });
    }
    if (req.method === "POST") {
      const body = (await req.json()) as { roomId?: string };
      if (body.roomId) this.state.roomId = body.roomId;
      return Response.json({ ok: true });
    }
    return new Response("Method not allowed", { status: 405 });
  }
}

GameRoom satisfies Party.Worker;
