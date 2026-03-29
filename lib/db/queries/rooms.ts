import { db } from "../index";
import { rooms, roomPlayers, gameRounds, playerAnswers } from "../schema";
import { eq, sql, desc, or, and, lt } from "drizzle-orm";

const WORD_POOL = [
  "BLEU", "CHAT", "LUNE", "ROSE", "VENT", "FEUX", "NOIR", "GRIS",
  "DOUX", "FORT", "VITE", "BEAU", "HAUT", "LOIN", "PEUR", "JOIE",
  "SAGE", "VRAI", "CIEL", "FLOT", "BOIS", "RIRE", "DANSE", "ELAN",
  "FORET", "MONDE", "SOLEIL", "NUIT", "BRUME", "OCEAN",
];

function generateCode(): string {
  const words = WORD_POOL.slice();
  const word = words[Math.floor(Math.random() * words.length)];
  const num = Math.floor(Math.random() * 90 + 10);
  return `${word}${num}`;
}

export async function createRoom(): Promise<{ id: string; code: string }> {
  let attempts = 0;
  while (attempts < 10) {
    const code = generateCode();
    try {
      const [room] = await db.insert(rooms).values({ code }).returning();
      return room;
    } catch {
      attempts++;
    }
  }
  throw new Error("Unable to generate unique room code");
}

export async function getRoomByCode(code: string) {
  return db.query.rooms.findFirst({
    where: eq(rooms.code, code.toUpperCase()),
  });
}

export async function expireStaleRooms() {
  // Rooms "waiting" for more than 1h or "playing" for more than 3h → finished
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
  await db
    .update(rooms)
    .set({ status: "finished", finishedAt: new Date() })
    .where(
      or(
        and(eq(rooms.status, "waiting"), lt(rooms.createdAt, oneHourAgo)),
        and(eq(rooms.status, "playing"), lt(rooms.createdAt, threeHoursAgo))
      )
    );
}

export async function getActiveRooms() {
  await expireStaleRooms();
  return db
    .select({
      id: rooms.id,
      code: rooms.code,
      status: rooms.status,
      createdAt: rooms.createdAt,
    })
    .from(rooms)
    .where(or(eq(rooms.status, "waiting"), eq(rooms.status, "playing")))
    .orderBy(desc(rooms.createdAt))
    .limit(20);
}

export async function updateRoomStatus(
  roomId: string,
  status: "waiting" | "playing" | "finished"
) {
  await db
    .update(rooms)
    .set({
      status,
      ...(status === "finished" ? { finishedAt: new Date() } : {}),
    })
    .where(eq(rooms.id, roomId));
}

export async function saveGameResults(data: {
  roomId: string;
  players: Array<{
    pseudonym: string;
    userId?: string;
    score: number;
    rank: number;
  }>;
  rounds: Array<{
    refId: string;
    roundNumber: number;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctOption: "a" | "b" | "c" | "d";
  }>;
}) {
  await updateRoomStatus(data.roomId, "finished");

  const insertedPlayers = await db
    .insert(roomPlayers)
    .values(
      data.players.map((p) => ({
        roomId: data.roomId,
        userId: p.userId,
        pseudonym: p.pseudonym,
        finalScore: p.score,
        rank: p.rank,
      }))
    )
    .returning();

  await db.insert(gameRounds).values(
    data.rounds.map((r) => ({
      roomId: data.roomId,
      refId: r.refId,
      roundNumber: r.roundNumber,
      optionA: r.optionA,
      optionB: r.optionB,
      optionC: r.optionC,
      optionD: r.optionD,
      correctOption: r.correctOption,
    }))
  );

  return insertedPlayers;
}
