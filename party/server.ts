import { routePartykitRequest, Server } from "partyserver";
import type { Connection } from "partyserver";
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
  youtubeUrl?: string | null;
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

export interface Env {
  Main: DurableObjectNamespace<GameRoom>;
  NEXTJS_URL: string;
}

type GamePhase = "lobby" | "question" | "reveal" | "finished";

const DEFAULT_SETTINGS: GameSettings = {
  totalRounds: 10,
  roundDurationMs: 10_000,
  autoChange: true,
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

export class GameRoom extends Server<Env> {
  // Game state lives in memory and relies on setTimeout, so the room must stay
  // awake while players are connected.
  static options = { hibernate: false };

  private game: GameRoomState = {
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

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private broadcastMsg(msg: ServerMessage, exclude?: string) {
    const data = JSON.stringify(msg);
    for (const conn of this.getConnections()) {
      if (conn.id !== exclude) conn.send(data);
    }
  }

  private sendTo(connectionId: string, msg: ServerMessage) {
    this.getConnection(connectionId)?.send(JSON.stringify(msg));
  }

  private broadcastLobby() {
    this.broadcastMsg({
      type: "LOBBY_UPDATE",
      players: this.getPlayerInfos(),
      hostClientId: this.game.hostClientId,
      settings: this.game.settings,
    });
  }

  private getPlayerInfos(): PlayerInfo[] {
    return Array.from(this.game.players.values())
      .map((p) => ({
        clientId: p.clientId,
        pseudonym: p.pseudonym,
        score: p.score,
        answered: p.currentAnswer !== null,
      }))
      .sort((a, b) => b.score - a.score);
  }

  private getScoreEntries(pointsThisRound: Record<string, number> = {}): ScoreEntry[] {
    return Array.from(this.game.players.values())
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

  onConnect(conn: Connection) {
    conn.send(JSON.stringify({
      type: "LOBBY_UPDATE",
      players: this.getPlayerInfos(),
      hostClientId: this.game.hostClientId,
      settings: this.game.settings,
    }));
  }

  onClose(conn: Connection) {
    const clientId = this.game.connections.get(conn.id);
    if (!clientId) return;
    this.game.connections.delete(conn.id);

    const player = this.game.players.get(clientId);
    if (!player) return;

    // Ignore the close event from a connection that has already been replaced
    // by a reconnect. The replacement remains the player's active connection.
    if (player.connectionId !== conn.id) return;

    if (this.game.phase === "lobby") {
      // En lobby : retrait immédiat
      this.removePlayer(clientId);
    } else {
      // En jeu : 30s de grâce pour reconnexion
      player.connectionId = "";
      this.broadcastLobby();

      setTimeout(() => {
        const p = this.game.players.get(clientId);
        if (p && !p.connectionId) {
          this.removePlayer(clientId);
        }
      }, 30_000);
    }
  }

  private removePlayer(clientId: string) {
    this.game.players.delete(clientId);

    // Si c'était l'hôte, passer le rôle à un joueur connecté aléatoire
    if (this.game.hostClientId === clientId) {
      const connected = Array.from(this.game.players.values()).filter((p) => p.connectionId);
      const next = connected[Math.floor(Math.random() * connected.length)];
      this.game.hostClientId = next?.clientId ?? null;
    }

    // Plus personne → fermer le salon
    if (this.game.players.size === 0) {
      this.closeRoom();
      return;
    }

    this.broadcastLobby();
  }

  private closeRoom() {
    if (this.game.roundTimer) clearTimeout(this.game.roundTimer);

    const baseUrl = (this.env.NEXTJS_URL) ?? "http://localhost:3000";
    fetch(`${baseUrl}/api/rooms/${this.name}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "finished" }),
    }).catch(() => {});
  }

  // ─── Messages ────────────────────────────────────────────────────────────────

  onMessage(conn: Connection, raw: string | ArrayBuffer) {
    const msg = JSON.parse(typeof raw === "string" ? raw : new TextDecoder().decode(raw)) as ClientMessage;

    if (msg.type === "JOIN") {
      this.handleJoin(conn, msg.clientId, msg.pseudonym, msg.userId);
      return;
    }

    const clientId = this.game.connections.get(conn.id);
    if (!clientId) return;

    switch (msg.type) {
      case "START_GAME":
        if (clientId === this.game.hostClientId) this.handleStartGame();
        break;
      case "SUBMIT_ANSWER":
        this.handleAnswer(clientId, msg.option, msg.clientTimestamp);
        break;
      case "SET_SETTINGS":
        if (clientId === this.game.hostClientId && this.game.phase === "lobby") {
          this.game.settings = { ...this.game.settings, ...msg.settings };
          this.broadcastLobby();
        }
        break;
      case "KICK_PLAYER":
        if (clientId === this.game.hostClientId && msg.clientId !== clientId) {
          this.kickPlayer(msg.clientId);
        }
        break;
      case "RESTART_GAME":
        if (clientId === this.game.hostClientId) this.handleRestartGame();
        break;
      case "NEXT_QUESTION":
        if (clientId === this.game.hostClientId && this.game.phase === "reveal") {
          if (this.game.refQueue.length > 0) {
            this.startNextRound();
          } else {
            this.endGame();
          }
        }
        break;
      case "PLAY_VIDEO":
        if (clientId === this.game.hostClientId) {
          this.broadcastMsg({ type: "PLAY_VIDEO" });
        }
        break;
    }
  }

  // ─── Game Logic ──────────────────────────────────────────────────────────────

  private handleJoin(conn: Connection, clientId: string, pseudonym: string, userId?: string) {
    // Reconnection
    const existing = this.game.players.get(clientId);
    if (existing) {
      if (existing.connectionId && existing.connectionId !== conn.id) {
        this.game.connections.delete(existing.connectionId);
      }
      existing.connectionId = conn.id;
      this.game.connections.set(conn.id, clientId);
      conn.send(JSON.stringify({
        type: "LOBBY_UPDATE",
        players: this.getPlayerInfos(),
        hostClientId: this.game.hostClientId,
        settings: this.game.settings,
      }));
      if (this.game.phase === "question" && this.game.currentRef && this.game.currentOptions) {
        conn.send(JSON.stringify({
          type: "QUESTION_START",
          question: {
            round: this.game.currentRound,
            total: this.game.settings.totalRounds,
            mediaUrl: this.game.currentRef.mediaUrl,
            mediaType: this.game.currentRef.mediaType,
            thumbnailUrl: this.game.currentRef.thumbnailUrl,
            question: this.game.currentRef.question ?? "Quelle est cette référence ?",
            options: this.game.currentOptions,
            serverTimestamp: this.game.roundStartTime,
            durationMs: this.game.settings.roundDurationMs,
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

    this.game.players.set(clientId, player);
    this.game.connections.set(conn.id, clientId);

    // First player = host
    if (!this.game.hostClientId) {
      this.game.hostClientId = clientId;
    }

    this.broadcastLobby();

    // If game is already running, send current question
    if (this.game.phase === "question" && this.game.currentRef && this.game.currentOptions) {
      conn.send(JSON.stringify({
        type: "QUESTION_START",
        question: {
          round: this.game.currentRound,
          total: this.game.settings.totalRounds,
          mediaUrl: this.game.currentRef.mediaUrl,
          mediaType: this.game.currentRef.mediaType,
          thumbnailUrl: this.game.currentRef.thumbnailUrl,
          question: this.game.currentRef.question ?? "Quelle est cette référence ?",
          options: this.game.currentOptions,
          serverTimestamp: this.game.roundStartTime,
          durationMs: this.game.settings.roundDurationMs,
        },
      }));
    }
  }

  private kickPlayer(targetClientId: string) {
    const player = this.game.players.get(targetClientId);
    if (!player) return;
    if (player.connectionId) {
      this.sendTo(player.connectionId, { type: "KICKED" });
    }
    this.game.players.delete(targetClientId);
    this.broadcastLobby();
  }

  private handleRestartGame() {
    if (this.game.phase !== "finished") return;

    if (this.game.roundTimer) clearTimeout(this.game.roundTimer);

    // Reset all scores and per-round state
    for (const player of this.game.players.values()) {
      player.score = 0;
      player.currentAnswer = null;
      player.currentPoints = 0;
    }

    this.game.phase = "lobby";
    this.game.refQueue = [];
    this.game.currentRef = null;
    this.game.currentOptions = null;
    this.game.correctOption = null;
    this.game.currentRound = 0;
    this.game.correctAnswerRank = 0;
    this.game.roundRecords = [];
    this.game.roundTimer = null;

    const baseUrl = (this.env.NEXTJS_URL) ?? "http://localhost:3000";
    fetch(`${baseUrl}/api/rooms/${this.name}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "waiting" }),
    }).catch(() => {});

    this.broadcastLobby();
  }

  private async handleStartGame() {
    if (this.game.phase !== "lobby") return;
    if (this.game.players.size < 1) return;

    try {
      const baseUrl = (this.env.NEXTJS_URL) ?? "https://quialaref.fr";
      const limit = this.game.settings.totalRounds;
      const res = await fetch(`${baseUrl}/api/refs?limit=${limit}`);
      const data = (await res.json()) as RefData[];

      if (!data || data.length === 0) {
        this.broadcastMsg({ type: "ERROR", message: "Pas assez de références approuvées pour jouer !" });
        return;
      }

      this.game.refQueue = data;
      this.game.settings.totalRounds = data.length;
      this.game.currentRound = 0;
      this.game.roundRecords = [];

      fetch(`${baseUrl}/api/rooms/${this.name}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "playing" }),
      }).catch(() => {});

      await this.startNextRound();
    } catch (err) {
      console.error("[PartyKit] handleStartGame error:", err);
      this.broadcastMsg({ type: "ERROR", message: "Erreur lors du chargement des références" });
    }
  }

  private async startNextRound() {
    const ref = this.game.refQueue.shift();
    if (!ref) {
      await this.endGame();
      return;
    }

    this.game.phase = "question";
    this.game.currentRound++;
    this.game.currentRef = ref;

    // Reset per-round state
    this.game.correctAnswerRank = 0;
    for (const player of this.game.players.values()) {
      player.currentAnswer = null;
      player.currentPoints = 0;
    }

    const correctAnswer = ref.correctAnswer ?? ref.title;
    const question = ref.question ?? `Quelle est cette référence ?`;
    const falseProps = ref.propositions.map((p) => p.text);
    const { options, correctOption } = buildQuestionOptions(correctAnswer, falseProps);

    this.game.currentOptions = options;
    this.game.correctOption = correctOption;
    this.game.roundStartTime = Date.now();

    this.game.roundRecords.push({
      refId: ref.id,
      roundNumber: this.game.currentRound,
      optionA: options.a,
      optionB: options.b,
      optionC: options.c,
      optionD: options.d,
      correctOption,
    });

    this.broadcastMsg({
      type: "QUESTION_START",
      question: {
        round: this.game.currentRound,
        total: this.game.settings.totalRounds,
        mediaUrl: ref.mediaUrl,
        mediaType: ref.mediaType,
        thumbnailUrl: ref.thumbnailUrl ?? undefined,
        question,
        options,
        serverTimestamp: this.game.roundStartTime,
        durationMs: this.game.settings.roundDurationMs,
        youtubeUrl: ref.youtubeUrl ?? null,
      },
    });

    if (this.game.roundTimer) clearTimeout(this.game.roundTimer);
    this.game.roundTimer = setTimeout(() => {
      this.revealAnswer();
    }, this.game.settings.roundDurationMs);
  }

  private handleAnswer(clientId: string, option: "a" | "b" | "c" | "d", clientTimestamp: number) {
    if (this.game.phase !== "question") return;
    const player = this.game.players.get(clientId);
    if (!player) return;

    const wasAnswered = player.currentAnswer !== null;
    const wasCorrectBefore = wasAnswered && player.currentAnswer === this.game.correctOption;
    player.currentAnswer = option;

    const isCorrect = option === this.game.correctOption;

    // Assign rank only when player answers correctly for the first time
    if (isCorrect && !wasCorrectBefore) {
      this.game.correctAnswerRank++;
      player.currentPoints = calculatePoints(this.game.correctAnswerRank, true);
    } else if (!isCorrect) {
      player.currentPoints = 0;
    }
    // If they were already correct and re-select correct: keep points

    // Confirm to player
    if (player.connectionId) {
      this.sendTo(player.connectionId, { type: "ANSWER_CONFIRMED", option });
    }

    // Only broadcast "answered" event on first answer (not on change)
    if (!wasAnswered) {
      const answeredCount = Array.from(this.game.players.values()).filter((p) => p.currentAnswer !== null).length;
      this.broadcastMsg({ type: "PLAYER_ANSWERED", clientId, answeredCount, totalPlayers: this.game.players.size });

      // If everyone answered, reveal immediately
      if (answeredCount === this.game.players.size) {
        if (this.game.roundTimer) clearTimeout(this.game.roundTimer);
        this.revealAnswer();
      }
    }
  }

  private revealAnswer() {
    if (this.game.phase !== "question") return;
    this.game.phase = "reveal";

    if (this.game.roundTimer) {
      clearTimeout(this.game.roundTimer);
      this.game.roundTimer = null;
    }

    // Apply points to scores
    const pointsThisRound: Record<string, number> = {};
    for (const player of this.game.players.values()) {
      player.score += player.currentPoints;
      pointsThisRound[player.clientId] = player.currentPoints;
    }

    const scores = this.getScoreEntries(pointsThisRound);
    const reveal: RevealPayload = {
      correctOption: this.game.correctOption!,
      correctText: this.game.currentOptions![this.game.correctOption!],
      submittedBy: this.game.currentRef?.submittedByUsername ?? null,
      scores,
      pointsThisRound,
    };

    this.broadcastMsg({ type: "ROUND_REVEAL", reveal });

    if (this.game.settings.autoChange) {
      setTimeout(() => {
        if (this.game.refQueue.length > 0) {
          this.startNextRound();
        } else {
          this.endGame();
        }
      }, REVEAL_DELAY_MS);
    }
  }

  private async endGame() {
    this.game.phase = "finished";
    const finalScores = this.getScoreEntries();
    this.broadcastMsg({ type: "GAME_OVER", finalScores });

    try {
      const baseUrl = (this.env.NEXTJS_URL) ?? "https://quialaref.fr";
      const players = Array.from(this.game.players.values()).map((p) => ({
        pseudonym: p.pseudonym,
        userId: p.userId,
        score: p.score,
        rank: finalScores.find((s) => s.clientId === p.clientId)?.rank ?? 1,
      }));
      await fetch(`${baseUrl}/api/rooms/${this.name}/results`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ players, rounds: this.game.roundRecords }),
      });
    } catch {}
  }

  async onRequest(req: Request): Promise<Response> {
    if (req.method === "GET") {
      return Response.json({ phase: this.game.phase, playerCount: this.game.players.size });
    }
    if (req.method === "POST") {
      const body = (await req.json()) as { roomId?: string };
      if (body.roomId) this.game.roomId = body.roomId;
      return Response.json({ ok: true });
    }
    return new Response("Method not allowed", { status: 405 });
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return (
      (await routePartykitRequest(request, env, { cors: true })) ||
      new Response("Not Found", { status: 404 })
    );
  },
} satisfies ExportedHandler<Env>;
