import { NextResponse } from "next/server";
import { getRoomByCode } from "@/lib/db/queries/rooms";

export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const room = await getRoomByCode(code);
  if (!room) return NextResponse.json({ error: "Salon introuvable" }, { status: 404 });
  if (room.status === "finished") return NextResponse.json({ error: "Cette partie est terminée" }, { status: 410 });
  return NextResponse.json(room);
}
