import { NextResponse } from "next/server";
import { getApprovedRefs, createRef } from "@/lib/db/queries/refs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") ?? "10");
    const refs = await getApprovedRefs(Math.min(limit, 50));
    return NextResponse.json(refs);
  } catch (err) {
    console.error("[API /refs GET]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  const { title, question, correctAnswer, mediaType, mediaUrl, mediaPublicId, thumbnailUrl, youtubeUrl, falsePropositions } = body;

  if (!title || !question || !correctAnswer || !mediaType || !mediaUrl || !mediaPublicId) {
    return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
  }

  if (!Array.isArray(falsePropositions) || falsePropositions.length < 3) {
    return NextResponse.json({ error: "Au moins 3 propositions fausses requises" }, { status: 400 });
  }

  const ref = await createRef({
    submittedBy: null,
    title,
    question,
    correctAnswer,
    mediaType,
    mediaUrl,
    mediaPublicId,
    thumbnailUrl,
    youtubeUrl: youtubeUrl || undefined,
    falsePropositions: falsePropositions.slice(0, 6),
  });

  return NextResponse.json(ref, { status: 201 });
}
