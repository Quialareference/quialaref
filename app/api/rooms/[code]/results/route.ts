import { NextResponse } from "next/server";
import { getRoomByCode, saveGameResults } from "@/lib/db/queries/rooms";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const room = await getRoomByCode(code);
  if (!room) {
    return NextResponse.json({ error: "Salon introuvable" }, { status: 404 });
  }

  const body = await req.json();
  await saveGameResults({
    roomId: room.id,
    players: body.players,
    rounds: body.rounds,
  });

  return NextResponse.json({ ok: true });
}
