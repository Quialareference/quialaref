import { NextResponse } from "next/server";
import { updateRefStatus, deleteRef } from "@/lib/db/queries/refs";

function checkAdmin(req: Request) {
  const secret = req.headers.get("x-admin-secret");
  return secret === process.env.ADMIN_SECRET;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  const { status } = await req.json();
  if (!["approved", "rejected", "pending"].includes(status)) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
  }
  await updateRefStatus(id, status);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  await deleteRef(id);
  return NextResponse.json({ ok: true });
}
