import { NextResponse } from "next/server";
import { createRoom, getActiveRooms, updateRoomStatus } from "@/lib/db/queries/rooms";

const PARTYKIT_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? "localhost:1999";
const EMPTY_ROOM_GRACE_MS = 30_000;

export async function GET() {
  try {
    const rooms = await getActiveRooms();
    const now = Date.now();

    const results = await Promise.allSettled(
      rooms.map(async (room) => {
        // Give the creator enough time to navigate to the room and open the
        // websocket before considering a brand-new room abandoned.
        if (now - room.createdAt.getTime() < EMPTY_ROOM_GRACE_MS) return room;

        try {
          const protocol = PARTYKIT_HOST.startsWith("localhost") ? "http" : "https";
          const res = await fetch(`${protocol}://${PARTYKIT_HOST}/parties/main/${room.code}`, {
            signal: AbortSignal.timeout(2000),
          });

          if (res.ok) {
            const data = await res.json() as { playerCount: number };
            if (data.playerCount === 0) {
              await updateRoomStatus(room.id, "finished");
              return null;
            }
          }
        } catch {
          // Keep the room visible if PartyKit is temporarily unreachable.
        }

        return room;
      })
    );

    const active = results.flatMap((result) =>
      result.status === "fulfilled" && result.value ? [result.value] : []
    );

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
