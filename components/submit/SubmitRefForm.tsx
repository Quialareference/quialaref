"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

type QType = "blank" | "open" | "closed";

interface Question {
  id: string;
  expanded: boolean;
  qType: QType;
  qText: string;
  selectedIndices: Set<number>;
  falseProps: string[];
  openAnswer: string;
  closedAnswer: "Oui" | "Non";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _uid = 0;
const uid = () => `q${++_uid}`;

function tokenize(s: string): string[] {
  return s.split(/(\s+)/).filter(Boolean);
}
function isWord(t: string) { return /\S/.test(t); }

function defaultQuestion(): Question {
  return {
    id: uid(), expanded: true,
    qType: "blank", qText: "",
    selectedIndices: new Set(), falseProps: ["", "", "", "", "", ""],
    openAnswer: "", closedAnswer: "Oui",
  };
}

function getYoutubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
    if (u.hostname.includes("youtube.com")) return u.searchParams.get("v");
  } catch {}
  return null;
}

async function uploadFile(file: File) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) throw new Error((await res.json()).error ?? "Erreur upload");
  return res.json() as Promise<{ url: string; path: string; mediaType: "image" | "video" }>;
}

// ─── BlankBuilder ─────────────────────────────────────────────────────────────

function BlankBuilder({ q, onChange }: { q: Question; onChange: (p: Partial<Question>) => void }) {
  const tokens = tokenize(q.qText);
  const sorted = Array.from(q.selectedIndices).sort((a, b) => a - b);
  const consecutive = sorted.length > 0 && sorted.every(
    (idx, i) => i === 0 || tokens.slice(sorted[i - 1] + 1, idx).every(t => !isWord(t))
  );
  const answer = consecutive && sorted.length > 0 ? sorted.map(i => tokens[i]).join(" ") : null;
  const preview = sorted.length > 0
    ? tokens.map((t, i) => q.selectedIndices.has(i) ? null : t)
        .reduce<string[]>((acc, t) => {
          if (t === null) { if (acc[acc.length - 1] !== "___") acc.push("___"); }
          else acc.push(t);
          return acc;
        }, []).join("")
    : q.qText;

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="text-[--text-muted] text-xs uppercase tracking-widest font-semibold block mb-1.5">Phrase</label>
        <textarea value={q.qText} rows={2} placeholder="La phrase contenant la bonne réponse"
          onChange={e => onChange({ qText: e.target.value.slice(0, 200), selectedIndices: new Set() })}
          className="w-full bg-[--bg-input] border border-[--border] rounded-xl px-4 py-2.5 text-[--text] placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none text-sm"
        />
      </div>
      {q.qText.trim() && (
        <div>
          <p className="text-[--text-muted] text-xs mb-2">Clique sur le(s) mot(s) = bonne réponse :</p>
          <div className="flex flex-wrap gap-1">
            {tokens.map((t, i) =>
              isWord(t) ? (
                <button key={i} type="button" onClick={() => {
                  const next = new Set(q.selectedIndices);
                  next.has(i) ? next.delete(i) : next.add(i);
                  onChange({ selectedIndices: next });
                }}
                  className={`px-2 py-1 rounded-lg text-sm font-medium transition-all ${q.selectedIndices.has(i) ? "bg-yellow-400 text-gray-900 font-bold" : "bg-white/10 text-[--text] hover:bg-white/20"}`}>
                  {t}
                </button>
              ) : <span key={i} className="text-[--text-muted] text-sm py-1">{t}</span>
            )}
          </div>
          {!consecutive && q.selectedIndices.size > 0 && <p className="text-orange-400 text-xs mt-1">Les mots doivent être consécutifs.</p>}
          {answer && <p className="text-[--text-muted] text-xs mt-2">Bonne réponse : <span className="text-yellow-400 font-semibold">{answer}</span> — <em>{preview}</em></p>}
        </div>
      )}
      <div>
        <p className="text-[--text-muted] text-xs uppercase tracking-widest font-semibold mb-2">Propositions fausses <span className="normal-case font-normal">(3 min)</span></p>
        <div className="grid grid-cols-2 gap-2">
          {q.falseProps.map((v, i) => (
            <input key={i} type="text" placeholder={i < 3 ? "Requis" : "Optionnel"} value={v}
              onChange={e => { const next = [...q.falseProps]; next[i] = e.target.value.slice(0, 60); onChange({ falseProps: next }); }}
              className="bg-[--bg-input] border border-[--border] rounded-xl px-3 py-2 text-[--text] placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── OpenBuilder ──────────────────────────────────────────────────────────────

function OpenBuilder({ q, onChange }: { q: Question; onChange: (p: Partial<Question>) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="text-[--text-muted] text-xs uppercase tracking-widest font-semibold block mb-1.5">Question</label>
        <textarea value={q.qText} rows={2} placeholder="Ex: Comment s'appelle ce personnage ?"
          onChange={e => onChange({ qText: e.target.value.slice(0, 200) })}
          className="w-full bg-[--bg-input] border border-[--border] rounded-xl px-4 py-2.5 text-[--text] placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none text-sm"
        />
      </div>
      <div>
        <label className="text-[--text-muted] text-xs uppercase tracking-widest font-semibold block mb-1.5">Bonne réponse</label>
        <input type="text" value={q.openAnswer} placeholder="La réponse correcte"
          onChange={e => onChange({ openAnswer: e.target.value.slice(0, 80) })}
          className="w-full bg-[--bg-input] border border-[--border] rounded-xl px-4 py-2.5 text-[--text] placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
        />
      </div>
      <div>
        <p className="text-[--text-muted] text-xs uppercase tracking-widest font-semibold mb-2">Propositions fausses <span className="normal-case font-normal">(3 min)</span></p>
        <div className="grid grid-cols-2 gap-2">
          {q.falseProps.map((v, i) => (
            <input key={i} type="text" placeholder={i < 3 ? "Requis" : "Optionnel"} value={v}
              onChange={e => { const next = [...q.falseProps]; next[i] = e.target.value.slice(0, 60); onChange({ falseProps: next }); }}
              className="bg-[--bg-input] border border-[--border] rounded-xl px-3 py-2 text-[--text] placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── ClosedBuilder ────────────────────────────────────────────────────────────

function ClosedBuilder({ q, onChange }: { q: Question; onChange: (p: Partial<Question>) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="text-[--text-muted] text-xs uppercase tracking-widest font-semibold block mb-1.5">Question</label>
        <textarea value={q.qText} rows={2} placeholder="Ex: Ce mème vient bien de Twitter ?"
          onChange={e => onChange({ qText: e.target.value.slice(0, 200) })}
          className="w-full bg-[--bg-input] border border-[--border] rounded-xl px-4 py-2.5 text-[--text] placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none text-sm"
        />
      </div>
      <div>
        <p className="text-[--text-muted] text-xs uppercase tracking-widest font-semibold mb-2">Bonne réponse</p>
        <div className="flex gap-2">
          {(["Oui", "Non"] as const).map(v => (
            <button key={v} type="button" onClick={() => onChange({ closedAnswer: v })}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors ${q.closedAnswer === v ? "bg-yellow-400 text-gray-900" : "bg-white/10 text-[--text] hover:bg-white/20"}`}>
              {v}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── QuestionCard ─────────────────────────────────────────────────────────────

const Q_TYPES: { key: QType; label: string }[] = [
  { key: "blank",  label: "Texte à trou" },
  { key: "open",   label: "Question ouverte" },
  { key: "closed", label: "Oui / Non" },
];

function QuestionCard({ q, index, onUpdate, onRemove }: {
  q: Question; index: number;
  onUpdate: (p: Partial<Question>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="bg-[--bg-card] border border-[--border] rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
        onClick={() => onUpdate({ expanded: !q.expanded })}>
        <span className="text-[--text-muted] text-xs font-mono w-5">#{index + 1}</span>
        <p className="flex-1 text-[--text] text-sm font-medium">
          {q.qText.trim() ? q.qText.slice(0, 60) + (q.qText.length > 60 ? "…" : "") : <span className="text-[--text-muted] italic">Nouvelle question</span>}
        </p>
        <span className="text-[--text-muted] text-xs bg-white/5 px-2 py-0.5 rounded-full">
          {Q_TYPES.find(t => t.key === q.qType)?.label}
        </span>
        <button type="button" onClick={e => { e.stopPropagation(); onRemove(); }}
          className="text-red-400/50 hover:text-red-400 text-xs transition-colors ml-1">✕</button>
        <span className="text-[--text-muted] text-xs">{q.expanded ? "▲" : "▼"}</span>
      </div>

      <AnimatePresence initial={false}>
        {q.expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-[--border] px-4 py-4 flex flex-col gap-4">
              {/* Type selector */}
              <div className="flex gap-2">
                {Q_TYPES.map(({ key, label }) => (
                  <button key={key} type="button" onClick={() => onUpdate({ qType: key })}
                    className={`flex-1 py-2 px-1 rounded-xl text-xs font-bold transition-colors text-center ${q.qType === key ? "bg-yellow-400 text-gray-900" : "bg-white/10 text-[--text] hover:bg-white/20"}`}>
                    {label}
                  </button>
                ))}
              </div>

              {q.qType === "blank"  && <BlankBuilder  q={q} onChange={onUpdate} />}
              {q.qType === "open"   && <OpenBuilder   q={q} onChange={onUpdate} />}
              {q.qType === "closed" && <ClosedBuilder q={q} onChange={onUpdate} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────

export function SubmitRefForm() {
  const [url, setUrl]             = useState("");
  const [videoId, setVideoId]     = useState<string | null>(null);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [fetching, setFetching]   = useState(false);

  const [file, setFile]           = useState<File | null>(null);
  const [preview, setPreview]     = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [usingThumb, setUsingThumb] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [title, setTitle]         = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);

  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(false);
  const [error, setError]         = useState("");

  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    setThumbnail(null); setVideoId(null);
    if (!url.trim()) return;
    const id = getYoutubeId(url);
    if (!id) return;
    setVideoId(id);
    debounce.current = setTimeout(async () => {
      setFetching(true);
      try {
        const res = await fetch(`/api/youtube/info?url=${encodeURIComponent(url)}`);
        if (res.ok) {
          const data = await res.json();
          setThumbnail(data.thumbnailUrl ?? null);
        }
      } catch {}
      setFetching(false);
    }, 800);
  }, [url]);

  function applyFile(f: File) {
    setFile(f); setUsingThumb(false);
    setMediaType(f.type.startsWith("video/") ? "video" : "image");
    setPreview(URL.createObjectURL(f));
  }

  function updateQuestion(id: string, patch: Partial<Question>) {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...patch } : q));
  }

  function validateQuestion(q: Question, i: number): string | null {
    if (!q.qText.trim()) return `Question #${i + 1} : phrase manquante.`;
    if (q.qType === "blank") {
      const tokens = tokenize(q.qText);
      const sorted = Array.from(q.selectedIndices).sort((a, b) => a - b);
      const consecutive = sorted.length > 0 && sorted.every(
        (idx, j) => j === 0 || tokens.slice(sorted[j - 1] + 1, idx).every(t => !isWord(t))
      );
      if (!consecutive || sorted.length === 0) return `Question #${i + 1} : sélectionne la bonne réponse.`;
      if (q.falseProps.filter(p => p.trim()).length < 3) return `Question #${i + 1} : 3 propositions fausses minimum.`;
    }
    if (q.qType === "open") {
      if (!q.openAnswer.trim()) return `Question #${i + 1} : bonne réponse manquante.`;
      if (q.falseProps.filter(p => p.trim()).length < 3) return `Question #${i + 1} : 3 propositions fausses minimum.`;
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!preview && !usingThumb) { setError("Ajoute une image ou une vidéo."); return; }
    if (!title.trim()) { setError("Indique le titre de la référence."); return; }
    if (questions.length === 0) { setError("Ajoute au moins une question."); return; }
    for (let i = 0; i < questions.length; i++) {
      const err = validateQuestion(questions[i], i);
      if (err) { setError(err); return; }
    }

    setLoading(true); setError("");
    try {
      let mediaUrl: string;
      let mediaPublicId: string;
      let finalMediaType: "image" | "video";

      if (usingThumb && thumbnail) {
        mediaUrl = thumbnail;
        mediaPublicId = videoId ? `yt:${videoId}` : "yt:thumb";
        finalMediaType = "image";
      } else {
        const up = await uploadFile(file!);
        mediaUrl = up.url; mediaPublicId = up.path; finalMediaType = up.mediaType;
      }

      for (const q of questions) {
        const tokens = tokenize(q.qText);
        const sorted = Array.from(q.selectedIndices).sort((a, b) => a - b);
        let question = q.qText;
        let correctAnswer = "";
        let falsePropositions: string[] = [];

        if (q.qType === "blank") {
          correctAnswer = sorted.map(i => tokens[i]).join(" ");
          question = tokens.map((t, i) => q.selectedIndices.has(i) ? null : t)
            .reduce<string[]>((acc, t) => {
              if (t === null) { if (acc[acc.length - 1] !== "___") acc.push("___"); }
              else acc.push(t);
              return acc;
            }, []).join("");
          falsePropositions = q.falseProps.filter(p => p.trim());
        } else if (q.qType === "open") {
          correctAnswer = q.openAnswer.trim();
          falsePropositions = q.falseProps.filter(p => p.trim());
        } else {
          correctAnswer = q.closedAnswer;
          falsePropositions = [q.closedAnswer === "Oui" ? "Non" : "Oui"];
        }

        const res = await fetch("/api/refs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(), question: question.trim(),
            correctAnswer, mediaType: finalMediaType, mediaUrl, mediaPublicId,
            youtubeUrl: url.trim() || undefined, falsePropositions,
          }),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? "Erreur");
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setUrl(""); setVideoId(null); setThumbnail(null);
    setFile(null); setPreview(null); setUsingThumb(false);
    setTitle(""); setQuestions([]); setSuccess(false); setError("");
  }

  if (success) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-green-500/20 border border-green-500/40 rounded-2xl p-8 text-center">
        <p className="text-4xl mb-3">🎉</p>
        <h2 className="text-2xl font-black text-[--text]">
          {questions.length > 1 ? `${questions.length} questions soumises !` : "Référence soumise !"}
        </h2>
        <p className="text-[--text-muted] mt-2">Elles seront vérifiées avant d&apos;apparaître. Merci !</p>
        <button onClick={reset} className="mt-6 text-yellow-400 hover:text-yellow-300 text-sm transition-colors">
          ➕ Soumettre une autre
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">

      {/* 1. Titre */}
      <div className="bg-[--bg-card] rounded-2xl p-5 border border-[--border]">
        <h2 className="text-[--text] font-bold mb-1">1. Nom de la référence</h2>
        <p className="text-[--text-muted] text-sm mb-3">Le nom complet tel qu&apos;il est connu</p>
        <input type="text" placeholder="Ex: Le Harlem Shake, Nabila, Gangnam Style…" value={title}
          onChange={e => setTitle(e.target.value.slice(0, 100))}
          className="w-full bg-[--bg-input] border border-[--border] rounded-xl px-4 py-3 text-[--text] placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
      </div>

      {/* 2. Lien YouTube */}
      <div className="bg-[--bg-card] rounded-2xl p-5 border border-[--border]">
        <h2 className="text-[--text] font-bold mb-1">2. Lien YouTube <span className="text-[--text-muted] font-normal text-sm">(optionnel)</span></h2>
        <p className="text-[--text-muted] text-sm mb-3">La miniature sera récupérée automatiquement.</p>
        <input type="url" placeholder="https://www.youtube.com/watch?v=..." value={url}
          onChange={e => setUrl(e.target.value)}
          className="w-full bg-[--bg-input] border border-[--border] rounded-xl px-4 py-3 text-[--text] placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
        />
        {fetching && <p className="text-[--text-muted] text-xs mt-2 animate-pulse">Récupération en cours…</p>}
        {thumbnail && !fetching && (
          <div className="flex items-start gap-3 mt-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumbnail} alt="Miniature" className="w-32 rounded-lg border border-[--border] object-cover" />
            {!preview ? (
              <button type="button" onClick={() => { setPreview(thumbnail); setMediaType("image"); setFile(null); setUsingThumb(true); }}
                className="text-yellow-400 hover:text-yellow-300 text-xs font-semibold bg-yellow-400/10 hover:bg-yellow-400/20 border border-yellow-400/30 rounded-lg px-3 py-2 transition-colors">
                ✓ Utiliser comme image
              </button>
            ) : usingThumb ? (
              <div className="flex flex-col gap-1">
                <span className="text-green-400 text-xs font-semibold">✓ Miniature utilisée</span>
                <button type="button" onClick={() => { setUsingThumb(false); setPreview(null); }}
                  className="text-[--text-muted] hover:text-[--text] text-xs transition-colors">Annuler</button>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* 3. Image / Vidéo */}
      <div className="bg-[--bg-card] rounded-2xl p-5 border border-[--border]">
        <h2 className="text-[--text] font-bold mb-3">3. Image ou vidéo</h2>
        <label className="block cursor-pointer"
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files?.[0]; if (f) applyFile(f); }}>
          <div className={`border-2 border-dashed rounded-xl p-5 text-center transition-colors ${isDragging ? "border-yellow-400 bg-yellow-400/10" : "border-[--border] hover:border-yellow-400/50"}`}>
            {preview ? (
              mediaType === "image"
                /* eslint-disable-next-line @next/next/no-img-element */
                ? <img src={preview} alt="Aperçu" className="max-h-40 mx-auto rounded-lg object-contain" />
                : <video src={preview} muted playsInline className="max-h-40 mx-auto rounded-lg" controls />
            ) : (
              <div className="text-[--text-muted]">
                <p className="text-3xl mb-2">🖼️</p>
                <p className="text-sm font-medium">{isDragging ? "Dépose ici !" : "Clique ou glisse une image / vidéo"}</p>
                <p className="text-xs mt-1">JPG, PNG, GIF, MP4, WebM — max 50 MB</p>
              </div>
            )}
          </div>
          <input type="file" accept="image/*,video/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) applyFile(f); }} />
        </label>
        {preview && (
          <button type="button" onClick={() => { setPreview(null); setFile(null); setUsingThumb(false); }}
            className="mt-2 text-[--text-muted] hover:text-red-400 text-xs transition-colors">
            ✕ Supprimer
          </button>
        )}
      </div>

      {/* 4. Questions */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[--text] font-bold">4. Questions</h2>
          {questions.length > 0 && (
            <span className="text-[--text-muted] text-xs">{questions.length} question{questions.length > 1 ? "s" : ""}</span>
          )}
        </div>

        {questions.map((q, i) => (
          <QuestionCard key={q.id} q={q} index={i}
            onUpdate={p => updateQuestion(q.id, p)}
            onRemove={() => setQuestions(prev => prev.filter(x => x.id !== q.id))}
          />
        ))}

        <button type="button"
          onClick={() => setQuestions(prev => [...prev, defaultQuestion()])}
          className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-[--border] hover:border-yellow-400/50 text-[--text-muted] hover:text-yellow-400 font-semibold text-sm py-3 rounded-2xl transition-colors">
          + Ajouter une question
        </button>
      </div>

      {error && <p className="text-red-400 text-sm bg-red-400/10 rounded-xl px-4 py-2">{error}</p>}

      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
        type="submit" disabled={loading}
        className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-bold text-sm py-3 rounded-xl transition-colors">
        {loading ? "Envoi en cours…" : questions.length > 1 ? `🚀 Soumettre ${questions.length} questions` : "🚀 Soumettre la référence"}
      </motion.button>
    </form>
  );
}
