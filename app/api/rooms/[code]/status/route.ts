import { NextResponse } from "next/server";
import { getRoomByCode, updateRoomStatus } from "@/lib/db/queries/rooms";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const room = await getRoomByCode(code);
  if (!room) return NextResponse.json({ error: "Salon introuvable" }, { status: 404 });

  const { status } = await req.json();
  await updateRoomStatus(room.id, status);
  return NextResponse.json({ ok: true });
}
