import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local", quiet: true });

const APPLY = process.argv.includes("--apply");

const candidates = [
  ["Coucou les musulmans, moi je mange la glace", "Coucou les musulmans, moi je mange ___.", "la glace", "lAMNAPSZzjw", ["du gâteau", "des frites", "une pomme", "le goûter", "du poulet", "la neige"]],
  ["Wassup avec les biscuits", "Wassup avec ___ ?", "les biscuits", "Z12nVEYG5Lw", ["les cacahuètes", "le goûter", "les chips", "les croissants", "la brioche", "les cornichons"]],
  ["Comment ça mon reuf", "Comment ça, ___ ?", "mon reuf", "IWxEys63TU4", ["mon frère", "mon gars", "chef", "monsieur", "mon pote", "capitaine"]],
  ["Bah alors, on est nul", "Bah alors, on est ___ ?", "nul", "Gwg9ah5FBI4", ["perdu", "fatigué", "jaloux", "timide", "fâché", "une chaussette"]],
  ["Bien soigné", "Bien ___.", "soigné", "NumgtePHgw8", ["joué", "mangé", "parlé", "essayé", "rangé", "savonné"]],
  ["Bonjour princesse", "Bonjour princesse, t'as bien ___ ?", "dormi", "1uYG8PKVzlY", ["mangé", "rêvé", "travaillé", "dansé", "révisé", "ronflé"]],
  ["Il est lent ce lait", "Il est lent, ___.", "ce lait", "tTnThdm3zas", ["ce train", "ce gars", "ton Wi-Fi", "ce serveur", "ce lama", "le lundi"]],
  ["Il fait tarpin chaud", "Il fait ___ chaud !", "tarpin", "LQaHd2rLS8k", ["super", "trop", "vraiment", "grave", "beaucoup trop", "gratin dauphinois"]],
  ["Nan, tape pas contre le mur gros", "Nan, tape pas contre ___, gros !", "le mur", "AE1Uu5Dluj0", ["la porte", "la table", "le bureau", "la vitre", "le frigo", "le ficus"]],
  ["On est au Cambodge ou quoi là", "On est au ___ ou quoi, là ?", "Cambodge", "7wmbWkGBjIc", ["Canada", "Maroc", "Portugal", "Japon", "Mexique", "royaume des moustiques"]],
  ["Ouais, c'est Greg", "Allô Bassem ? Ouais, c'est ___.", "Greg", "E9fxFF9rbeM", ["Fred", "Mehdi", "Kevin", "Michel", "le voisin", "Gregory sans le ory"]],
  ["Mais nan, mais nan", "Mais nan, mais ___ !", "nan", "roFnPsV5qXw", ["oui", "quoi", "stop", "frère", "attends", "jamais de la vie"]],
  ["Tu préfères moi ou ton père", "Tu préfères moi ou ___ ?", "ton père", "xTkHSdDvDB0", ["ta mère", "ton frère", "tes potes", "ton ex", "le chien", "la raclette"]],
  ["Vas-y, ouvre ta gueule", "Vas-y, ouvre ___ !", "ta gueule", "B2e5Pglk-UY", ["la porte", "les yeux", "ton sac", "le frigo", "la fenêtre", "ton paquet de chips"]],
  ["Ce soir, on va manger du riz", "Ce soir, on va manger ___ !", "du riz", "kWXjsyLOw3g", ["des pâtes", "du poulet", "une pizza", "des frites", "du couscous", "le bulletin scolaire"]],
  ["Donne-les-moi bordel", "Donne-les-moi, ___ !", "bordel", "4RNbnJRQD8w", ["vite", "maintenant", "frérot", "s'il te plaît", "tout de suite", "espèce de ravioli"]],
  ["Moustapha, t'es collé", "Moustapha, t'es ___ !", "collé", "ttdyfXacwvQ", ["grillé", "bloqué", "coincé", "fini", "en retard", "devenu un meuble"]],
  ["Tu veux du pain", "Tu veux ___ ?", "du pain", "_oapCozQ2mY", ["de l'eau", "un café", "des frites", "un bonbon", "une claque", "du Wi-Fi"]],
  ["Ça n'a rien à voir", "Ça n'a rien ___ !", "à voir", "Gm5lhfWNEAk", ["à faire", "de drôle", "de logique", "à prouver", "de normal", "à manger avec du riz"]],
  ["Cavale, cavale Kenny", "Cavale, cavale, ___ !", "Kenny", "2GycvIB5bZg", ["Kevin", "Johnny", "Michel", "frérot", "champion", "petit poney"]],
  ["Il faut sacher", "Il faut ___.", "sacher", "ZhePIJAGh6o", ["savoir", "comprendre", "réfléchir", "apprendre", "écouter", "respirer par les genoux"]],
  ["Je suis propriétaire, je suis fonctionnaire", "Je suis propriétaire, je suis ___, alors !", "fonctionnaire", "UI-YiSxSrKo", ["locataire", "responsable", "prioritaire", "le patron", "chez moi", "ministre du canapé"]],
  ["Quoicoubeh", "Tu dis quoi ? — ___.", "Quoicoubeh", "Um3Ft3HBaGc", ["Quoi donc", "Hein", "Comment", "Pardon", "Quoicoubaka", "Feur"]],
  ["Mais ça va pas ou quoi là", "Mais ça va pas ou quoi, ___ ?", "là", "YRaJpZjnb3k", ["toi", "frère", "encore", "sérieux", "chef", "dans ta dimension"]],
  ["Abrège frère", "Abrège, ___.", "frère", "A5r3zZUVdCQ", ["chef", "monsieur", "maintenant", "vite fait", "s'il te plaît", "on a un train"]],
  ["Wesh alors", "Wesh, ___ ?", "alors", "weSE0QtQXMc", ["frère", "tranquille", "ça dit quoi", "bien ou bien", "monsieur", "on mange quand"]],
].map(([title, question, answer, videoId, distractors]) => ({ title, question, answer, videoId, distractors }));

const normalize = (value) => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

function validateCandidates() {
  if (candidates.length !== 26) throw new Error(`26 références attendues, ${candidates.length} reçues`);
  const titles = new Set();
  const videos = new Set();
  for (const candidate of candidates) {
    const title = normalize(candidate.title);
    if (titles.has(title)) throw new Error(`Titre dupliqué : ${candidate.title}`);
    if (videos.has(candidate.videoId)) throw new Error(`Vidéo dupliquée : ${candidate.videoId}`);
    if (!candidate.question.includes("___")) throw new Error(`Blanc absent : ${candidate.title}`);
    if (candidate.distractors.length !== 6) throw new Error(`Six distracteurs requis : ${candidate.title}`);
    const choices = new Set(candidate.distractors.map(normalize));
    if (choices.size !== 6 || choices.has(normalize(candidate.answer))) throw new Error(`Distracteurs invalides : ${candidate.title}`);
    titles.add(title);
    videos.add(candidate.videoId);
  }
}

async function verifyYoutubeVideo(candidate) {
  const watchUrl = `https://www.youtube.com/watch?v=${candidate.videoId}`;
  const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`, {
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`${candidate.title}: YouTube HTTP ${response.status}`);
  return (await response.json()).title;
}

validateCandidates();

const verified = [];
for (const candidate of candidates) {
  const youtubeTitle = await verifyYoutubeVideo(candidate);
  verified.push({ ...candidate, youtubeTitle });
  console.log(`OK\t${candidate.title}\t${youtubeTitle}`);
}

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL absente de .env.local");
const sql = postgres(process.env.DATABASE_URL, { max: 1 });

try {
  const existing = await sql`select title, correct_answer, media_public_id from refs`;
  const existingTitles = new Set(existing.map((row) => normalize(row.title)));
  const existingVideos = new Set(existing.map((row) => row.media_public_id));
  const duplicates = verified.filter((candidate) =>
    existingTitles.has(normalize(candidate.title))
    || existingVideos.has(`youtube:${candidate.videoId}`)
  );

  if (duplicates.length) throw new Error(`Doublons détectés : ${duplicates.map((candidate) => candidate.title).join(", ")}`);

  if (!APPLY) {
    console.log(`Validation OK : ${verified.length} nouvelles refs et ${verified.length * 6} distracteurs prêts.`);
    console.log("Aucune écriture effectuée. Relancez avec --apply pour importer.");
  } else {
    const insertedIds = [];
    await sql.begin(async (transaction) => {
      for (const candidate of verified) {
        const mediaUrl = `https://img.youtube.com/vi/${candidate.videoId}/hqdefault.jpg`;
        const [created] = await transaction`
          insert into refs (
            title, question, correct_answer, media_type, media_url, media_public_id,
            thumbnail_url, youtube_url, status
          ) values (
            ${candidate.title}, ${candidate.question}, ${candidate.answer}, 'image',
            ${mediaUrl}, ${`youtube:${candidate.videoId}`}, ${mediaUrl},
            ${`https://www.youtube.com/watch?v=${candidate.videoId}`}, 'approved'
          ) returning id
        `;
        insertedIds.push(created.id);
        for (const text of candidate.distractors) {
          await transaction`insert into ref_propositions (ref_id, text) values (${created.id}, ${text})`;
        }
      }
    });

    const [verification] = await sql`
      select count(distinct refs.id)::int as ref_count,
             count(ref_propositions.id)::int as proposition_count
      from refs
      join ref_propositions on ref_propositions.ref_id = refs.id
      where refs.id in ${sql(insertedIds)}
    `;
    if (verification.ref_count !== candidates.length || verification.proposition_count !== candidates.length * 6) {
      throw new Error(`Vérification échouée : ${JSON.stringify(verification)}`);
    }
    console.log(`Import terminé : ${verification.ref_count} refs et ${verification.proposition_count} distracteurs ajoutés.`);
  }
} finally {
  await sql.end();
}
