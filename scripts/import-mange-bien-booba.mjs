import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local", quiet: true });

const refs = [
  {
    title: "Mange bien, wesh",
    question: "Mais mange ___, wesh !",
    answer: "bien",
    choices: ["tranquille", "doucement", "encore", "d'abord", "proprement", "sans les mains"],
    mediaType: "image",
    mediaUrl: "https://img.youtube.com/vi/CBFvpVZ7y30/hqdefault.jpg",
    mediaId: "youtube:CBFvpVZ7y30",
    youtubeUrl: "https://www.youtube.com/watch?v=CBFvpVZ7y30",
  },
  {
    title: "C’est quoi ce miel, ce mail-là ?",
    question: "Mais c’est quoi ce ___, ce mail-là ?",
    answer: "miel",
    choices: ["délire", "truc", "message", "spam", "vocal", "sirop"],
    mediaType: "video",
    // Rediffusion de l’appel par Generasonrap, le 17 décembre 2020.
    mediaUrl: "https://video.twimg.com/ext_tw_video/1339534225717010434/pu/vid/320x568/c_lw1bSHkUok1H4h.mp4?tag=10",
    mediaId: "x:1339534225717010434",
    thumbnailUrl: "https://pbs.twimg.com/ext_tw_video_thumb/1339534225717010434/pu/img/aUR0Yr2lmgPabIUk.jpg",
    youtubeUrl: null,
  },
];

for (const ref of refs) {
  const thumbnailsAndVideos = [
    [ref.mediaUrl, ref.mediaType === "image" ? "image/" : "video/"],
    ...(ref.thumbnailUrl ? [[ref.thumbnailUrl, "image/"]] : []),
    ...(ref.youtubeUrl ? [[`https://www.youtube.com/oembed?url=${encodeURIComponent(ref.youtubeUrl)}`, "application/json"]] : []),
  ];
  for (const [url, expectedType] of thumbnailsAndVideos) {
    const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    await response.body?.cancel();
    if (!response.ok || !response.headers.get("content-type")?.startsWith(expectedType)) {
      throw new Error(`Média inaccessible pour ${ref.title} : HTTP ${response.status} (${url})`);
    }
  }
}

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL absente de .env.local");
const sql = postgres(process.env.DATABASE_URL, { max: 1 });
const apply = process.argv.includes("--apply");

try {
  await sql.begin(async (transaction) => {
    if (apply) await transaction`lock table refs in share row exclusive mode`;
    for (const ref of refs) {
      const existing = await transaction`
        select id from refs
        where media_public_id = ${ref.mediaId}
           or lower(title) = lower(${ref.title})
      `;
      if (existing.length) {
        console.log(`Déjà présente : ${ref.title} (${existing[0].id})`);
        continue;
      }
      if (!apply) {
        console.log(`Prête à importer : ${ref.title}`);
        continue;
      }
      const [created] = await transaction`
        insert into refs (
          title, question, correct_answer, media_type, media_url, media_public_id,
          thumbnail_url, youtube_url, status
        ) values (
          ${ref.title}, ${ref.question}, ${ref.answer}, ${ref.mediaType}, ${ref.mediaUrl},
          ${ref.mediaId}, ${ref.thumbnailUrl ?? ref.mediaUrl}, ${ref.youtubeUrl}, 'approved'
        ) returning id
      `;
      const choices = ref.choices.map((text) => ({ ref_id: created.id, text }));
      const inserted = await transaction`
        insert into ref_propositions ${transaction(choices, "ref_id", "text")} returning id
      `;
      if (inserted.length !== choices.length) throw new Error(`Propositions incomplètes : ${ref.title}`);
      console.log(`Importée : ${ref.title} (${created.id}) avec ${inserted.length} distracteurs`);
    }
  });
} finally {
  await sql.end();
}
