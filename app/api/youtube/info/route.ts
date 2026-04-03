import { NextRequest, NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";

function getYoutubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
    if (u.hostname.includes("youtube.com")) return u.searchParams.get("v");
  } catch {}
  return null;
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  const videoId = getYoutubeId(url);
  if (!videoId) return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });

  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

  let transcript: string | null = null;
  try {
    const items = await YoutubeTranscript.fetchTranscript(videoId, { lang: "fr" }).catch(() =>
      YoutubeTranscript.fetchTranscript(videoId)
    );
    transcript = items.map((i) => i.text).join(" ");
  } catch {
    transcript = null;
  }

  return NextResponse.json({ videoId, thumbnailUrl, transcript });
}
