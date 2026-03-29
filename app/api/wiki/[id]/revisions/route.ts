import { NextResponse } from "next/server";
import { getWikiRevisions } from "@/lib/db/queries/wiki";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const revisions = await getWikiRevisions(id);
  return NextResponse.json(revisions);
}
