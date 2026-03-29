"use client";

import { useState } from "react";
import { motion } from "framer-motion";

async function uploadFile(file: File): Promise<{ url: string; path: string; mediaType: "image" | "video" }> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: formData });
  if (!res.ok) {
    const d = await res.json();
    throw new Error(d.error ?? "Erreur upload");
  }
  return res.json();
}

// Splits a sentence into tokens (words + spaces/punctuation) for word selection
function tokenize(sentence: string): string[] {
  return sentence.split(/(\s+)/).filter(Boolean);
}

function isWord(token: string): boolean {
  return /\S/.test(token);
}

export function SubmitRefForm() {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [title, setTitle] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [falseProps, setFalseProps] = useState(["", "", "", "", "", ""]);
  const [file, setFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const tokens = tokenize(questionText);
  const wordTokens = tokens.map((t, i) => ({ token: t, index: i, isWord: isWord(t) }));

  // Sorted selected word indices (consecutive check)
  const sortedSelected = Array.from(selectedIndices).sort((a, b) => a - b);
  const isConsecutive = sortedSelected.length > 0 && sortedSelected.every(
    (idx, i) => i === 0 || tokens.slice(sortedSelected[i - 1] + 1, idx).every(t => !isWord(t))
  );
  const correctAnswer = isConsecutive && sortedSelected.length > 0
    ? sortedSelected.map(i => tokens[i]).join(" ")
    : null;

  // Build question preview: replace selected span with ___
  const questionPreview = sortedSelected.length > 0
    ? tokens.map((t, i) => selectedIndices.has(i) ? null : t)
        .reduce<string[]>((acc, t, i) => {
          if (t === null) {
            if (acc[acc.length - 1] !== "___") acc.push("___");
          } else {
            acc.push(t);
          }
          return acc;
        }, [])
        .join("")
    : questionText;

  function toggleWord(index: number) {
    setSelectedIndices(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function applyFile(f: File) {
    setFile(f);
    const isVideo = f.type.startsWith("video/");
    setMediaType(isVideo ? "video" : "image");
    setPreview(URL.createObjectURL(f));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) applyFile(f);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) applyFile(f);
  }

  function updateFalseProp(i: number, val: string) {
    setFalseProps((prev) => {
      const next = [...prev];
      next[i] = val;
      return next;
    });
  }

  function handleQuestionChange(val: string) {
    setQuestionText(val);
    setSelectedIndices(new Set());
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setError("Ajoute une image ou une vidéo."); return; }
    if (!title.trim()) { setError("Indique le nom complet de la référence."); return; }
    if (!questionText.trim()) { setError("Écris une question."); return; }
    if (!correctAnswer) { setError(isConsecutive ? "Sélectionne au moins un mot comme bonne réponse." : "Les mots sélectionnés doivent être consécutifs."); return; }
    const validFalse = falseProps.filter((p) => p.trim());
    if (validFalse.length < 3) {
      setError("Donne au moins 3 propositions fausses.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const uploaded = await uploadFile(file);

      const res = await fetch("/api/refs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          question: questionPreview.trim(),
          correctAnswer: correctAnswer!.trim(),
          mediaType: uploaded.mediaType,
          mediaUrl: uploaded.url,
          mediaPublicId: uploaded.path,
          youtubeUrl: youtubeUrl.trim() || undefined,
          falsePropositions: validFalse,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Erreur lors de la soumission");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-green-500/20 border border-green-500/40 rounded-2xl p-8 text-center"
      >
        <p className="text-4xl mb-3">🎉</p>
        <h2 className="text-2xl font-black text-white">Référence soumise !</h2>
        <p className="text-white/60 mt-2">
          Elle sera vérifiée avant d&apos;apparaître dans les parties. Merci !
        </p>
        <button
          onClick={() => {
            setSuccess(false);
            setTitle("");
            setQuestionText("");
            setSelectedIndices(new Set());
            setFalseProps(["", "", "", "", "", ""]);
            setYoutubeUrl("");
            setFile(null);
            setPreview(null);
          }}
          className="mt-6 text-yellow-400 hover:text-yellow-300 text-sm transition-colors"
        >
          ➕ Soumettre une autre
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">

      {/* 1. Media */}
      <div className="bg-[--bg-card] rounded-2xl p-5 border border-[--border]">
        <h2 className="text-[--text] font-bold mb-4">1. Image ou vidéo de la référence</h2>
        <label
          className="block cursor-pointer"
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
            isDragging ? "border-yellow-400 bg-yellow-400/10" : "border-white/20 hover:border-yellow-400/50"
          }`}>
            {preview ? (
              mediaType === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="Aperçu" className="max-h-48 mx-auto rounded-lg object-contain" />
              ) : (
                <video src={preview} muted playsInline className="max-h-48 mx-auto rounded-lg" controls />
              )
            ) : (
              <div className="text-white/40">
                <p className="text-4xl mb-2">🖼️</p>
                <p className="font-medium">{isDragging ? "Dépose ici !" : "Clique ou glisse une image / vidéo"}</p>
                <p className="text-xs mt-1">JPG, PNG, GIF, MP4, WebM — max 50 MB</p>
              </div>
            )}
          </div>
          <input type="file" accept="image/*,video/*" onChange={handleFileChange} className="hidden" />
        </label>
      </div>

      {/* 1b. Lien YouTube (optionnel) */}
      <div className="bg-[--bg-card] rounded-2xl p-5 border border-[--border]">
        <h2 className="text-[--text] font-bold mb-1">Lien YouTube <span className="text-white/40 font-normal text-sm">(optionnel)</span></h2>
        <p className="text-[--text-muted] text-sm mb-3">Pour retrouver la source facilement plus tard</p>
        <input
          type="url"
          placeholder="https://www.youtube.com/watch?v=..."
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          className="w-full bg-[--bg-input] border border-[--border] rounded-xl px-4 py-3 text-[--text] placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
        />
      </div>

      {/* 2. Nom de la ref */}
      <div className="bg-[--bg-card] rounded-2xl p-5 border border-[--border]">
        <h2 className="text-[--text] font-bold mb-1">2. Nom complet de la référence</h2>
        <p className="text-[--text-muted] text-sm mb-3">Le nom officiel/complet tel qu&apos;il est connu</p>
        <input
          type="text"
          placeholder="Ex: Le Harlem Shake, Nabila, Gangnam Style…"
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, 100))}
          className="w-full bg-[--bg-input] border border-[--border] rounded-xl px-4 py-3 text-[--text] placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
      </div>

      {/* 3. Question avec sélection du mot */}
      <div className="bg-[--bg-card] rounded-2xl p-5 border border-[--border]">
        <h2 className="text-[--text] font-bold mb-1">3. La question</h2>
        <p className="text-[--text-muted] text-sm mb-3">
          Écris une phrase, puis clique sur le mot qui est la bonne réponse
        </p>

        <textarea
          placeholder="Ex: Cette danse virale s'appelle le Harlem Shake"
          value={questionText}
          onChange={(e) => handleQuestionChange(e.target.value.slice(0, 200))}
          rows={2}
          className="w-full bg-[--bg-input] border border-[--border] rounded-xl px-4 py-3 text-[--text] placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none text-sm"
        />

        {/* Word selection */}
        {questionText.trim() && (
          <div className="mt-3">
            <p className="text-white/40 text-xs mb-2">Clique sur le ou les mots qui forment la bonne réponse :</p>
            <div className="flex flex-wrap gap-1">
              {wordTokens.map(({ token, index, isWord: word }) =>
                word ? (
                  <button
                    key={index}
                    type="button"
                    onClick={() => toggleWord(index)}
                    className={`px-2 py-1 rounded-lg text-sm font-medium transition-all ${
                      selectedIndices.has(index)
                        ? "bg-yellow-400 text-gray-900 font-bold"
                        : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                  >
                    {token}
                  </button>
                ) : (
                  <span key={index} className="text-white/30 text-sm py-1">{token}</span>
                )
              )}
            </div>

            {!isConsecutive && selectedIndices.size > 0 && (
              <p className="text-orange-400 text-xs mt-2">Les mots doivent être consécutifs dans la phrase.</p>
            )}

            {/* Preview */}
            <div className="mt-3 bg-[--bg-input] rounded-xl px-4 py-3 border border-[--border]">
              <p className="text-white/40 text-xs mb-1">Aperçu de la question en jeu :</p>
              <p className="text-[--text] text-sm font-medium">
                {correctAnswer ? (
                  questionPreview.split("___").map((part, i, arr) => (
                    <span key={i}>
                      {part}
                      {i < arr.length - 1 && (
                        <span className="bg-yellow-400/20 text-yellow-300 font-bold rounded px-1">___</span>
                      )}
                    </span>
                  ))
                ) : selectedIndices.size > 0 ? (
                  <span className="text-orange-400/70 italic text-xs">Sélectionne des mots consécutifs</span>
                ) : (
                  <span className="text-white/40 italic">Sélectionne des mots ci-dessus</span>
                )}
              </p>
              {correctAnswer && (
                <p className="text-white/40 text-xs mt-2">
                  Bonne réponse : <span className="text-yellow-400 font-semibold">{correctAnswer}</span>
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4. False propositions */}
      <div className="bg-[--bg-card] rounded-2xl p-5 border border-[--border]">
        <h2 className="text-[--text] font-bold mb-1">4. Propositions fausses</h2>
        <p className="text-[--text-muted] text-sm mb-4">
          3 à 6 mots/noms qui pourraient sembler vrais — le jeu en pioche 3 au hasard
        </p>
        <div className="flex flex-col gap-3">
          {falseProps.map((val, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-white/30 text-sm w-4">{i + 1}.</span>
              <input
                type="text"
                placeholder={i < 3 ? "Requis" : "Optionnel"}
                value={val}
                onChange={(e) => updateFalseProp(i, e.target.value.slice(0, 60))}
                className="flex-1 bg-[--bg-input] border border-[--border] rounded-xl px-4 py-2 text-[--text] placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
              />
            </div>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-red-400 text-sm bg-red-400/10 rounded-xl px-4 py-2">{error}</p>
      )}

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        type="submit"
        disabled={loading}
        className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-bold text-sm py-3 rounded-xl transition-colors"
      >
        {loading ? "Envoi en cours..." : "🚀 Soumettre la référence"}
      </motion.button>
    </form>
  );
}
