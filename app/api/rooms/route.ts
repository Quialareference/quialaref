import { NextResponse } from "next/server";
import { createRoom, getActiveRooms } from "@/lib/db/queries/rooms";

export async function GET() {
  try {
    const rooms = await getActiveRooms();
    return NextResponse.json(rooms);
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
