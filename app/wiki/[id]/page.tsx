"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";

interface WikiRef {
  id: string;
  title: string;
  question: string | null;
  correctAnswer: string | null;
  mediaType: "image" | "video";
  mediaUrl: string;
  thumbnailUrl: string | null;
  youtubeUrl: string | null;
  playCount: number;
  createdAt: string;
  propositions: { text: string }[];
  wikiPage: { content: string; updatedAt: string } | null;
}

interface Revision {
  id: string;
  editSummary: string | null;
  createdAt: string;
}

// Minimal markdown-like renderer
function renderContent(text: string) {
  return text
    .split("\n")
    .map((line, i) => {
      if (line.startsWith("## ")) return <h2 key={i} className="text-xl font-black text-[--text] mt-6 mb-2">{line.slice(3)}</h2>;
      if (line.startsWith("# ")) return <h1 key={i} className="text-2xl font-black text-[--text] mt-6 mb-2">{line.slice(2)}</h1>;
      if (line.startsWith("- ")) return <li key={i} className="ml-4 text-[--text-muted]">{line.slice(2)}</li>;
      if (line.trim() === "") return <br key={i} />;
      return <p key={i} className="text-[--text] leading-relaxed">{line}</p>;
    });
}

export default function WikiRefPage() {
  const { id } = useParams<{ id: string }>();
  const [ref, setRef] = useState<WikiRef | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [password, setPassword] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Revisions
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [showRevisions, setShowRevisions] = useState(false);

  useEffect(() => {
    fetch(`/api/wiki/${id}`)
      .then((r) => { if (r.status === 404) { setNotFound(true); return null; } return r.json(); })
      .then((data) => { if (data) setRef(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  function startEdit() {
    setEditContent(ref?.wikiPage?.content ?? "");
    setEditSummary("");
    setSaveError("");
    setEditing(true);
  }

  async function saveEdit() {
    if (!password) { setSaveError("Mot de passe requis."); return; }
    setSaveLoading(true);
    setSaveError("");
    try {
      const res = await fetch(`/api/wiki/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-secret": password },
        body: JSON.stringify({ content: editContent, summary: editSummary }),
      });
      if (!res.ok) {
        const d = await res.json();
        setSaveError(d.error ?? "Erreur");
        return;
      }
      setRef((prev) => prev ? { ...prev, wikiPage: { content: editContent, updatedAt: new Date().toISOString() } } : prev);
      setEditing(false);
    } finally {
      setSaveLoading(false);
    }
  }

  async function loadRevisions() {
    const res = await fetch(`/api/wiki/${id}/revisions`);
    const data = await res.json();
    setRevisions(data);
    setShowRevisions(true);
  }

  if (loading) {
    return <main className="max-w-4xl mx-auto px-4 py-16 text-center text-[--text-muted] animate-pulse">Chargement…</main>;
  }

  if (notFound || !ref) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-4xl mb-4">🤷</p>
        <h1 className="text-2xl font-black text-[--text] mb-2">Référence introuvable</h1>
        <Link href="/wiki" className="text-yellow-400 hover:text-yellow-300 text-sm">← Retour au wiki</Link>
      </main>
    );
  }

  const content = ref.wikiPage?.content ?? "";

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[--text-muted] mb-6">
        <Link href="/wiki" className="hover:text-yellow-400 transition-colors">Wiki</Link>
        <span>/</span>
        <span className="text-[--text]">{ref.title}</span>
      </div>

      {/* Title + actions */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-[--text] leading-tight">{ref.title}</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {ref.playCount > 0 && (
              <span className="text-xs bg-white/10 text-[--text-muted] px-2.5 py-1 rounded-full">
                {ref.playCount.toLocaleString("fr-FR")} parties jouées
              </span>
            )}
            <span className="text-xs bg-white/10 text-[--text-muted] px-2.5 py-1 rounded-full capitalize">
              {ref.mediaType === "image" ? "📷 Image" : "🎬 Vidéo"}
            </span>
          </div>
        </div>
        {!editing && (
          <button
            onClick={startEdit}
            className="flex-shrink-0 text-xs font-semibold bg-[--bg-card] border border-[--border] hover:border-yellow-400/50 text-[--text] px-4 py-2 rounded-full transition-all"
          >
            ✏️ Modifier
          </button>
        )}
      </div>

      {/* Layout: content + infobox */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* Main content */}
        <div className="flex-1 min-w-0">

          {/* Edit form */}
          {editing ? (
            <div className="bg-[--bg-card] border border-[--border] rounded-2xl p-5 mb-6">
              <h2 className="font-bold text-[--text] mb-3">Modifier le contenu</h2>
              <p className="text-[--text-muted] text-xs mb-3">Supporte les titres (#, ##) et les listes (- item)</p>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={12}
                className="w-full bg-[--bg-input] border border-[--border] rounded-xl px-4 py-3 text-[--text] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-y"
                placeholder="Décris cette référence…&#10;&#10;## Origine&#10;Cette référence vient de...&#10;&#10;## Popularité&#10;..."
              />
              <div className="mt-3 flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Résumé de la modification (optionnel)"
                  value={editSummary}
                  onChange={(e) => setEditSummary(e.target.value)}
                  className="bg-[--bg-input] border border-[--border] rounded-xl px-4 py-2 text-[--text] text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
                <input
                  type="password"
                  placeholder="Mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-[--bg-input] border border-[--border] rounded-xl px-4 py-2 text-[--text] text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
                {saveError && <p className="text-red-400 text-xs">{saveError}</p>}
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={saveEdit}
                    disabled={saveLoading}
                    className="bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-bold text-sm px-5 py-2 rounded-full transition-colors"
                  >
                    {saveLoading ? "Enregistrement…" : "Enregistrer"}
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="bg-white/10 hover:bg-white/20 text-[--text] text-sm px-4 py-2 rounded-full transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="prose-custom mb-6">
              {content ? (
                <div className="text-[--text] leading-relaxed space-y-1">
                  {renderContent(content)}
                </div>
              ) : (
                <div className="bg-[--bg-card] border border-dashed border-[--border] rounded-2xl p-8 text-center">
                  <p className="text-[--text-muted] text-sm mb-3">Aucune description pour l&apos;instant.</p>
                  <button
                    onClick={startEdit}
                    className="text-yellow-400 hover:text-yellow-300 text-sm font-semibold transition-colors"
                  >
                    ✏️ Sois le premier à contribuer
                  </button>
                </div>
              )}
            </div>
          )}

          {/* In-game question */}
          {ref.question && (
            <div className="bg-[--bg-card] border border-[--border] rounded-2xl p-4 mb-4">
              <p className="text-[--text-muted] text-xs uppercase tracking-widest mb-2">Question en jeu</p>
              <p className="text-[--text] font-semibold">
                {ref.question.replace("___", <span className="text-yellow-400 font-black">___</span> as unknown as string)}
                {" "}<span className="text-yellow-400 font-black">{ref.correctAnswer}</span>
              </p>
            </div>
          )}

          {/* False propositions */}
          {ref.propositions.length > 0 && (
            <div className="bg-[--bg-card] border border-[--border] rounded-2xl p-4 mb-4">
              <p className="text-[--text-muted] text-xs uppercase tracking-widest mb-3">Distracteurs connus</p>
              <div className="flex flex-wrap gap-2">
                {ref.propositions.map((p, i) => (
                  <span key={i} className="text-xs bg-white/10 text-[--text-muted] px-3 py-1 rounded-full">{p.text}</span>
                ))}
              </div>
            </div>
          )}

          {/* Revisions */}
          <div className="border-t border-[--border] pt-4 mt-2">
            {showRevisions ? (
              <div>
                <p className="text-xs text-[--text-muted] uppercase tracking-widest mb-3">Historique des modifications</p>
                {revisions.length === 0 ? (
                  <p className="text-[--text-muted] text-sm">Aucune modification enregistrée.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {revisions.map((r) => (
                      <div key={r.id} className="flex items-center justify-between text-xs text-[--text-muted]">
                        <span>{r.editSummary || "Modification"}</span>
                        <span>{new Date(r.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={loadRevisions}
                className="text-xs text-[--text-muted] hover:text-yellow-400 transition-colors"
              >
                Voir l&apos;historique des modifications →
              </button>
            )}
          </div>
        </div>

        {/* Infobox */}
        <aside className="lg:w-72 flex-shrink-0">
          <div className="bg-[--bg-card] border border-[--border] rounded-2xl overflow-hidden sticky top-20">
            {/* Media */}
            <div className="relative aspect-video bg-black/40">
              {ref.mediaType === "image" ? (
                <Image src={ref.mediaUrl} alt={ref.title} fill className="object-contain" />
              ) : (
                <video src={ref.mediaUrl} muted playsInline loop autoPlay className="w-full h-full object-contain" poster={ref.thumbnailUrl ?? undefined} />
              )}
            </div>
            <div className="p-4 flex flex-col gap-2 text-sm">
              <div className="flex justify-between text-[--text-muted]">
                <span>Type</span>
                <span className="text-[--text] font-medium capitalize">{ref.mediaType === "image" ? "Image" : "Vidéo"}</span>
              </div>
              <div className="flex justify-between text-[--text-muted]">
                <span>Parties</span>
                <span className="text-[--text] font-medium">{ref.playCount.toLocaleString("fr-FR")}</span>
              </div>
              {ref.youtubeUrl && (
                <a
                  href={ref.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex items-center justify-center gap-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-xl px-3 py-2 text-xs font-semibold transition-colors"
                >
                  ▶ Voir sur YouTube
                </a>
              )}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
