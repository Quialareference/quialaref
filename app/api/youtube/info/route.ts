import { NextRequest, NextResponse } from "next/server";

function getYoutubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
    if (u.hostname.includes("youtube.com")) return u.searchParams.get("v");
  } catch {}
  return null;
}

async function fetchTranscript(videoId: string): Promise<string | null> {
  try {
    // Fetch the YouTube watch page to extract caption track URLs
    const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
      },
    });
    if (!pageRes.ok) return null;
    const html = await pageRes.text();

    // Extract caption tracks from ytInitialPlayerResponse
    const idx = html.indexOf('"captionTracks":');
    if (idx === -1) return null;
    const jsonStart = html.indexOf("[", idx);
    let depth = 0, jsonEnd = jsonStart;
    for (; jsonEnd < html.length; jsonEnd++) {
      if (html[jsonEnd] === "[") depth++;
      else if (html[jsonEnd] === "]" && --depth === 0) { jsonEnd++; break; }
    }
    const match = [null, html.slice(jsonStart, jsonEnd)];
    if (!match) return null;

    const tracks: { languageCode: string; baseUrl: string; kind?: string }[] = JSON.parse(match[1] as string);
    if (!tracks.length) return null;

    // Priority: fr manual > fr auto-generated > any fr > any auto > first available
    const track =
      tracks.find(t => t.languageCode === "fr" && !t.kind) ??
      tracks.find(t => t.languageCode === "fr") ??
      tracks.find(t => t.languageCode?.startsWith("fr")) ??
      tracks.find(t => t.kind === "asr") ??
      tracks[0];

    if (!track?.baseUrl) return null;

    // Fetch the caption XML
    const captionRes = await fetch(track.baseUrl + "&fmt=json3");
    if (!captionRes.ok) return null;
    const data = await captionRes.json() as {
      events?: { segs?: { utf8: string }[] }[];
    };

    const text = (data.events ?? [])
      .flatMap(e => e.segs ?? [])
      .map(s => s.utf8.replace(/\n/g, " ").trim())
      .filter(Boolean)
      .join(" ");

    return text || null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  const videoId = getYoutubeId(url);
  if (!videoId) return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });

  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  const transcript = await fetchTranscript(videoId);

  return NextResponse.json({ videoId, thumbnailUrl, transcript });
}
