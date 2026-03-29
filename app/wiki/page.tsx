"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

interface RefRow {
  id: string;
  title: string;
  question: string | null;
  mediaType: "image" | "video";
  mediaUrl: string;
  thumbnailUrl: string | null;
  playCount: number;
}

export default function WikiBrowsePage() {
  const [refs, setRefs] = useState<RefRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/wiki")
      .then((r) => r.json())
      .then((data) => { setRefs(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = search.trim()
    ? refs.filter((r) => r.title.toLowerCase().includes(search.toLowerCase()))
    : refs;

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-black text-[--text] mb-2">Wiki des références</h1>
        <p className="text-[--text-muted] text-base max-w-lg mx-auto">
          Toutes les références internet françaises — explications, origines, anecdotes.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-8 max-w-xl mx-auto">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          type="text"
          placeholder="Rechercher une référence…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[--bg-card] border border-[--border] rounded-full pl-10 pr-4 py-3 text-[--text] placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
      </div>

      {loading && (
        <div className="text-center text-[--text-muted] py-20 animate-pulse">Chargement…</div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center text-[--text-muted] py-20">
          <p className="text-4xl mb-3">🔍</p>
          <p>Aucune référence trouvée pour &quot;{search}&quot;</p>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((ref) => (
          <Link
            key={ref.id}
            href={`/wiki/${ref.id}`}
            className="group bg-[--bg-card] border border-[--border] rounded-2xl overflow-hidden hover:border-yellow-400/50 hover:shadow-lg transition-all"
          >
            {/* Thumbnail */}
            <div className="relative aspect-video bg-black/40 overflow-hidden">
              {ref.mediaType === "image" ? (
                <Image
                  src={ref.mediaUrl}
                  alt={ref.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <video
                  src={ref.mediaUrl}
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                  poster={ref.thumbnailUrl ?? undefined}
                />
              )}
            </div>
            {/* Info */}
            <div className="p-3">
              <h2 className="font-bold text-[--text] text-sm leading-tight truncate group-hover:text-yellow-400 transition-colors">
                {ref.title}
              </h2>
              {ref.playCount > 0 && (
                <p className="text-[--text-muted] text-xs mt-1">{ref.playCount.toLocaleString("fr-FR")} parties</p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {!loading && filtered.length > 0 && (
        <p className="text-center text-[--text-muted] text-xs mt-8">
          {filtered.length} référence{filtered.length > 1 ? "s" : ""}
          {search && ` pour "${search}"`}
        </p>
      )}
    </main>
  );
}
