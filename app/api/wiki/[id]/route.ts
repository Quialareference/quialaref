import { NextResponse } from "next/server";
import { getRefWikiPage, upsertWikiPage, getWikiRevisions } from "@/lib/db/queries/wiki";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ref = await getRefWikiPage(id);
  if (!ref) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json(ref);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const secret = req.headers.get("x-admin-secret");
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { id } = await params;
  const { content, summary } = await req.json();
  if (typeof content !== "string") {
    return NextResponse.json({ error: "Contenu manquant" }, { status: 400 });
  }
  await upsertWikiPage(id, content, summary ?? "");
  return NextResponse.json({ ok: true });
}
