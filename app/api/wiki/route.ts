import { NextResponse } from "next/server";
import { getAllApprovedRefs } from "@/lib/db/queries/wiki";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("q") ?? undefined;
  const refs = await getAllApprovedRefs(search);
  return NextResponse.json(refs);
}
