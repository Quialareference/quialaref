import { NextResponse } from "next/server";
import { createRoom, getActiveRooms, updateRoomStatus } from "@/lib/db/queries/rooms";

const PARTYKIT_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? "localhost:1999";

export async function GET() {
  try {
    const rooms = await getActiveRooms();

    // Check PartyKit for real player count, kill empty rooms
    const results = await Promise.allSettled(
      rooms.map(async (room) => {
        try {
          const protocol = PARTYKIT_HOST.startsWith("localhost") ? "http" : "https";
          const res = await fetch(`${protocol}://${PARTYKIT_HOST}/parties/main/${room.code}`, {
            signal: AbortSignal.timeout(2000),
          });
          if (res.ok) {
            const data = await res.json() as { playerCount: number; phase: string };
            if (data.playerCount === 0) {
              await updateRoomStatus(room.id, "finished");
              return null;
            }
          }
        } catch {}
        return room;
      })
    );

    const active = results
      .filter((r) => r.status === "fulfilled" && r.value !== null)
      .map((r) => (r as PromiseFulfilledResult<typeof rooms[0]>).value);

    return NextResponse.json(active);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST() {
  try {
    const room = await createRoom();
    return NextResponse.json(room);
  } catch {
    return NextResponse.json({ error: "Impossible de créer le salon" }, { status: 500 });
  }
}
