import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local", quiet: true });

const APPLY = process.argv.includes("--apply");

const candidates = [
  {
    title: "Eh bien, méfiez-vous",
    question: "Eh bien, ___. C'est un conseil d'ami.",
    answer: "méfiez-vous",
    videoId: "ByMhPw35z2k",
    distractors: ["calmez-vous", "écoutez-moi", "retournez-vous", "dépêchez-vous", "accrochez-vous", "évitez les lamas"],
  },
  {
    title: "J'ai rendu service, monsieur",
    question: "On m'a demandé de rendre service, j'ai ___, monsieur.",
    answer: "rendu service",
    videoId: "R0KOMh9tFUc",
    distractors: ["fait au mieux", "simplement aidé", "dit oui", "ouvert la porte", "dépanné quelqu'un", "prêté mon canapé"],
  },
  {
    title: "120 secondes, ça fait 1 minute 20",
    question: "120 secondes, ça fait ___.",
    answer: "1 minute 20",
    videoId: "X-dCM9k5E6E",
    distractors: ["2 minutes", "1 minute 12", "120 minutes", "2 minutes 20", "une éternité", "ça dépend du vent"],
  },
  {
    title: "La routourne va vite tourner",
    question: "J'espère que la ___ va vite tourner.",
    answer: "routourne",
    videoId: "u4CB2QP7j04",
    distractors: ["roue", "chance", "situation", "tendance", "météo", "tartine"],
  },
  {
    title: "C'est exceptionnel comme article",
    question: "Ouais, c'est ___ comme article.",
    answer: "exceptionnel",
    videoId: "rIccFruFgNo",
    distractors: ["incroyable", "magnifique", "pas mal", "très floral", "du jamais-vu", "exceptionnellement cher"],
  },
  {
    title: "C'est honteux !",
    question: "C'est ___ !",
    answer: "honteux",
    videoId: "PZSEXOMuO58",
    distractors: ["scandaleux", "inadmissible", "terrible", "abusé", "une honte", "du football"],
  },
  {
    title: "C'est les émotions",
    question: "C'est les ___.",
    answer: "émotions",
    videoId: "YOXctSRantA",
    distractors: ["sensations", "frissons", "nerfs", "larmes", "hormones", "merguez"],
  },
  {
    title: "C'est Nicolas qui paie",
    question: "C'est ___ qui paie.",
    answer: "Nicolas",
    videoId: "zl_qZRv5QtQ",
    distractors: ["Kevin", "Macron", "le patron", "encore bibi", "la France", "personne"],
  },
  {
    title: "Parce que c'est notre projet !",
    question: "Parce que c'est notre ___ !",
    answer: "projet",
    videoId: "MoJvWHW5zAo",
    distractors: ["avenir", "destin", "combat", "rêve", "programme", "giga chantier"],
  },
  {
    title: "Concentre-toi !",
    question: "___-toi !",
    answer: "Concentre",
    videoId: "Dd1-mzKs4AY",
    distractors: ["Calme", "Réveille", "Accroche", "Détends", "Contrôle", "Hydrate"],
  },
  {
    title: "Encore ? Ça fait beaucoup là, non ?",
    question: "Encore ? Ça fait ___ là, non ?",
    answer: "beaucoup",
    videoId: "6elK8VI1rPs",
    distractors: ["trop", "énorme", "assez", "un paquet", "dix fois", "buffet à volonté"],
  },
  {
    title: "Je possède des thunes",
    question: "Je possède des ___.",
    answer: "thunes",
    videoId: "aIVsz5Pj0eE",
    distractors: ["patates", "euros", "actions", "lingots", "économies", "moula"],
  },
  {
    title: "La blague est valide !",
    question: "La blague est ___ !",
    answer: "valide",
    videoId: "O-Em-Tqll3k",
    distractors: ["drôle", "validée", "bonne", "incroyable", "nulle", "homologuée"],
  },
  {
    title: "Moi ? Mais qui c'est, celle-là ?!",
    question: "Moi ? Mais qui ___, celle-là ?!",
    answer: "c'est",
    videoId: "X6QijOBrT5A",
    distractors: ["elle est", "voilà", "elle croit être", "l'a invitée", "parle comme ça", "a sonné"],
  },
  {
    title: "La République, c'est moi !",
    question: "La République, ___ !",
    answer: "c'est moi",
    videoId: "hy0vG_KVvQE",
    distractors: ["c'est nous", "c'est ici", "je la défends", "elle est là", "c'est sacré", "c'est René"],
  },
  {
    title: "Qu'est-ce que tu sous-entends ?",
    question: "Qu'est-ce que tu ___ ?",
    answer: "sous-entends",
    videoId: "90LQyz5qz9k",
    distractors: ["insinues", "racontes", "veux dire", "prépares", "regardes", "mijotes"],
  },
  {
    title: "Casse-toi, pauv' con !",
    question: "Casse-toi, ___ !",
    answer: "pauv' con",
    videoId: "Eau5_Gi3icQ",
    distractors: ["pauvre type", "mon grand", "s'il te plaît", "de là", "petit malin", "espèce d'andouille"],
  },
  {
    title: "Au revoir",
    question: "Et puis je vous dis : ___.",
    answer: "au revoir",
    videoId: "5PS0gY1juCE",
    distractors: ["à bientôt", "merci", "bonne nuit", "adieu", "salut", "fin de transmission"],
  },
  {
    title: "Vous pensez ? Moi, je pense pas",
    question: "Vous pensez ? Moi, je ___.",
    answer: "pense pas",
    videoId: "JfX0A31bOeY",
    distractors: ["crois pas", "sais pas", "dis rien", "vois pas", "mange pas", "suis pas sûr"],
  },
  {
    title: "C'est une hallucination collective !",
    question: "C'est une hallucination... ___ !",
    answer: "collective",
    videoId: "AZebPXVdEDY",
    distractors: ["totale", "cosmique", "générale", "visuelle", "nationale", "de groupe"],
  },
  {
    title: "Ne t'inquiète pas, ça va bien se passer",
    question: "Ne t'inquiète pas, ça va ___.",
    answer: "bien se passer",
    videoId: "JLaxBrz_Ylk",
    distractors: ["aller", "s'arranger", "très bien finir", "passer crème", "rouler tout seul", "exploser doucement"],
  },
  {
    title: "C'est carré",
    question: "C'est ___.",
    answer: "carré",
    videoId: "aDgmrbGR1Uk",
    distractors: ["propre", "validé", "réglé", "nickel", "plié", "rond"],
  },
  {
    title: "Un troupeau de bananes",
    question: "Un troupeau de ___.",
    answer: "bananes",
    videoId: "q4sojhUQV74",
    distractors: ["girafes", "moutons", "pingouins", "patates", "nuggets", "chaises"],
  },
  {
    title: "Philippe ! Je sais où tu te caches !",
    question: "Philippe ! Je sais où tu ___ !",
    answer: "te caches",
    videoId: "EOxUWLl2HFs",
    distractors: ["habites", "dors", "travailles", "cours", "ranges les clés", "mets le ketchup"],
  },
  {
    title: "La question, elle est vite répondue",
    question: "La question, elle est vite ___.",
    answer: "répondue",
    videoId: "8VSFjyF3B5E",
    distractors: ["réglée", "posée", "comprise", "oubliée", "esquivée", "remboursée"],
  },
  {
    title: "Qui aurait pu prédire ?",
    question: "Qui aurait pu ___ ?",
    answer: "prédire",
    videoId: "SsqYCvJvxQY",
    distractors: ["savoir", "imaginer", "deviner", "anticiper", "prévenir", "lire la météo"],
  },
  {
    title: "Rends l'argent !",
    question: "Rends ___ !",
    answer: "l'argent",
    videoId: "jYiHyfEoxws",
    distractors: ["le micro", "les clés", "la monnaie", "le goûter", "la PlayStation", "les sous"],
  },
  {
    title: "On en a gros !",
    question: "On en a ___ !",
    answer: "gros",
    videoId: "sxZTqXfx28U",
    distractors: ["marre", "assez", "plein le dos", "lourd", "beaucoup", "une charrette"],
  },
  {
    title: "Oublie que t'as aucune chance, vas-y, fonce !",
    question: "Oublie que t'as aucune chance. Vas-y, ___ !",
    answer: "fonce",
    videoId: "syJCMxz15KU",
    distractors: ["tente", "cours", "plonge", "insiste", "improvise", "prends un râteau"],
  },
  {
    title: "J'aime me beurrer la biscotte",
    question: "J'aime me ___ la biscotte.",
    answer: "beurrer",
    videoId: "DDJdkJ6-RQg",
    distractors: ["griller", "toaster", "tartiner", "tremper", "casser", "admirer"],
  },
];

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
    if (choices.size !== 6 || choices.has(normalize(candidate.answer))) {
      throw new Error(`Distracteurs invalides : ${candidate.title}`);
    }
    titles.add(title);
    videos.add(candidate.videoId);
  }
}

async function verifyYoutubeVideo(candidate) {
  const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${candidate.videoId}`)}&format=json`;
  const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error(`${candidate.title}: YouTube HTTP ${response.status}`);
  const metadata = await response.json();
  return metadata.title;
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

  if (duplicates.length) {
    throw new Error(`Doublons détectés : ${duplicates.map((candidate) => candidate.title).join(", ")}`);
  }

  if (!APPLY) {
    console.log(`Validation OK : ${verified.length} nouvelles refs et ${verified.length * 6} distracteurs prêts.`);
    console.log("Aucune écriture effectuée. Relancez avec --apply pour importer.");
    process.exitCode = 0;
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
