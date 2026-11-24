import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local", quiet: true });

const APPLY = process.argv.includes("--apply");

const candidates = [
  ["Le gras, c'est la vie", "Le gras, ___.", "c'est la vie", "x2QBDQXn3iU", ["c'est sacré", "c'est important", "c'est bon", "ça nourrit", "c'est magique", "c'est la famille"]],
  ["C'est pas faux", "C'est pas ___.", "faux", "9diaThxYnKA", ["vrai", "possible", "clair", "compliqué", "gagné", "du fromage"]],
  ["Un petit coup de polish", "À l'occasion, je vous mettrai un petit coup de ___.", "polish", "zCGBivrCO2A", ["peinture", "propre", "cire", "chiffon", "neuf", "ketchup"]],
  ["Ils sont fous, ces Romains !", "Ils sont fous, ces ___ !", "Romains", "wP1VXiormXw", ["Gaulois", "Bretons", "Vikings", "touristes", "Parisiens", "sangliers"]],
  ["100 patates !", "Ça fait cent ___ !", "patates", "tf7CeOuuuOE", ["francs", "briques", "euros", "balles", "carottes", "millions"]],
  ["Qu'est-ce que vous faites mercredi prochain ?", "Qu'est-ce que vous faites ___ prochain ?", "mercredi", "_KAsE7L76Jw", ["jeudi", "samedi", "dimanche", "lundi", "à Noël", "au siècle"]],
  ["Bref.", "___. Je remets tout à demain.", "Bref", "JmghDKkeiik", ["Bon", "Voilà", "Donc", "Écoute", "En résumé", "Flemme"]],
  ["Ça va couper, chérie !", "Ça va ___, chérie !", "couper", "E4kX9sdpuMc", ["trancher", "piquer", "brûler", "saigner", "claquer", "faire des étincelles"]],
  ["Tu bluffes, Martoni !", "Tu bluffes, ___ !", "Martoni", "tNeig1leks8", ["Maurice", "Simon", "patron", "champion", "l'ami", "Macaroni"]],
  ["On peut tromper mille fois une personne", "On peut tromper mille fois ___.", "une personne", "S9k7Avk5jJE", ["mille personnes", "le même pigeon", "sa grand-mère", "tout le monde", "le fisc", "un poisson rouge"]],
  ["Quand je suis content, je vomis", "Quand je suis content, je ___.", "vomis", "NSx2tSfh3p4", ["ris", "danse", "chante", "pleure", "saute", "commande une pizza"]],
  ["Vous voulez un whisky ou juste un doigt ?", "Vous voulez un whisky ou juste ___ ?", "un doigt", "1FlJsZTpcXs", ["un verre", "une goutte", "des glaçons", "un fond", "un demi", "une saucisse"]],
  ["Ça dépend, ça dépasse", "Ça dépend, ça ___.", "dépasse", "6gc_svqHO4M", ["se discute", "déborde", "varie", "fonctionne", "se mesure", "patine"]],
  ["Il s'appelle Juste Leblanc", "Il s'appelle Juste ___.", "Leblanc", "LEoGqNrR7-E", ["Martin", "Dupont", "Michel", "Lebrun", "Juste", "Unefois"]],
  ["C'est fin, ça se mange sans faim", "C'est fin, c'est très fin, ça se mange ___.", "sans faim", "gnazrMKLTdU", ["avec les doigts", "tout seul", "en dessert", "froid", "sans pain", "sous les aisselles"]],
  ["Pas de bras, pas de chocolat", "Pas de bras, pas de ___.", "chocolat", "_evDnoeJgMY", ["bonbon", "dessert", "gâteau", "câlin", "télé", "PlayStation"]],
  ["Prenez un chewing-gum, Émile", "Prenez un ___, Émile.", "chewing-gum", "9ScGEtPsZLU", ["bonbon", "cachet", "café", "mouchoir", "biscuit", "suppositoire"]],
  ["Les cons, ça ose tout", "Les cons, ça ose ___.", "tout", "HmI6co3ensE", ["beaucoup", "rien", "parfois", "encore", "tellement", "même le karaoké"]],
  ["Le train de tes injures", "Le train de tes injures roule sur le rail de mon ___.", "indifférence", "fz7NN4anHLk", ["silence", "mépris", "calme", "patience", "élégance", "goûter"]],
  ["Monde de merde", "Monde de ___.", "merde", "XdVjIzTBDdQ", ["fous", "brutes", "dingues", "malheur", "clowns", "merguez"]],
  ["J't'ai cassé !", "J't'ai ___ !", "cassé", "DYnGSD7IMIo", ["eu", "grillé", "calmé", "plié", "séché", "rangé au placard"]],
  ["J'aime pas trop les voleurs", "J'aime pas trop les ___.", "voleurs", "irFsx_zm_4E", ["menteurs", "tricheurs", "copieurs", "profiteurs", "moustiques", "fils de pub"]],
  ["C'est tout pour le moment", "C'est tout pour ___.", "le moment", "nlffxYjiDyE", ["aujourd'hui", "ce soir", "maintenant", "cette fois", "la mission", "les haricots"]],
  ["C'est trop calme", "C'est trop calme, j'aime ___ ça.", "pas trop beaucoup", "u4r2i7tohPM", ["pas vraiment", "pas tellement", "pas du tout", "moyennement", "pas trop trop", "pas les lundis"]],
  ["Pas de pierre, pas de construction", "Pas de pierre, pas de ___.", "construction", "6xIJo_tp2f8", ["palais", "maison", "chantier", "pyramide", "mur", "barbecue"]],
  ["Bonne ou mauvaise situation", "Vous savez, moi, je ne crois pas qu'il y ait de bonne ou de mauvaise ___.", "situation", "TEVzxycBBUU", ["réponse", "journée", "personne", "météo", "idée", "tartiflette"]],
  ["C'est votre dernier mot ?", "C'est votre dernier ___ ?", "mot", "35Z26pAi7MM", ["choix", "avis", "essai", "joker", "appel", "kebab"]],
  ["Il est où le cucul ?", "Il est où le cucul, elle est où la ___ ?", "têtête", "aGjrO3vVEO4", ["pupuce", "mimine", "baballe", "choupette", "mémère", "saucisse"]],
  ["Non, je suis ton père", "Non. Je suis ton ___.", "père", "_w2IDfX9RVc", ["frère", "patron", "voisin", "oncle", "coach", "livreur"]],
  ["C'est cela, oui", "C'est cela, ___.", "oui", "dyV_lCw-v4E", ["non", "peut-être", "bien sûr", "évidemment", "mon petit", "Jean-Pierre"]],
].map(([title, question, answer, videoId, distractors]) => ({ title, question, answer, videoId, distractors }));

const normalize = (value) => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

function validateCandidates() {
  if (candidates.length !== 30) throw new Error(`30 références attendues, ${candidates.length} reçues`);
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
  const existingAnswers = new Set(existing.map((row) => normalize(row.correct_answer ?? "")).filter(Boolean));
  const existingVideos = new Set(existing.map((row) => row.media_public_id));
  const duplicates = verified.filter((candidate) =>
    existingTitles.has(normalize(candidate.title))
    || existingAnswers.has(normalize(candidate.answer))
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
    if (verification.ref_count !== 30 || verification.proposition_count !== 180) {
      throw new Error(`Vérification échouée : ${JSON.stringify(verification)}`);
    }
    console.log(`Import terminé : ${verification.ref_count} refs et ${verification.proposition_count} distracteurs ajoutés.`);
  }
} finally {
  await sql.end();
}
