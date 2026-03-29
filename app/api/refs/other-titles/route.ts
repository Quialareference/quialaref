import { NextResponse } from "next/server";
import { getOtherApprovedTitles } from "@/lib/db/queries/refs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const excludeId = searchParams.get("excludeId") ?? "";
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const titles = await getOtherApprovedTitles(excludeId, Math.min(limit, 30));
  return NextResponse.json(titles);
}
