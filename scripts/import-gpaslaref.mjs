import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local", quiet: true });

const APPLY = process.argv.includes("--apply");

const verifiedVideos = {
  "mais-vous-fumez-monsieur": ["r-tIwkBJStM", "Mais vous fumez Monsieur ?!"],
  eddymalou: ["FCSVKa_9Amo", "Mais oui c'est clair ! Eddy Malou !"],
  "pas-mal-les-bzez": ["uD-Yl7xbw7M", "Comment ça pas mal les bzez Apex ?"],
  "voila-jaime-bien": ["-JvuYMHbIp0", "Ritchie — Voilà, j'aime bien !"],
  "je-pete-ma-biere-ma-libellule": ["g8v20xJcxBE", "Je pète ma bière, ma libellule !"],
  "appelez-les-hendek": ["NJsM8GmeT9c", "On appelle les hendeks"],
  "combien-meme": ["QzGmNFKVLPU", "COMBIEN ???"],
  "menu-whopper-pour-commencer": ["n7v5uOSKaSE", "Un menu Whopper là pour commencer"],
  "les-coutures-tiennent-pas": ["8444Uu-Gdsw", "Les coutures tiennent pas"],
  "ya-pas-de-panneau": ["YpAJmOOVQnM", "Ya pas de panneau"],
  "oh-putain-laurent": ["B3yC-5M2atw", "Oh putain Laurent"],
  "puceau-moi-serieusement": ["_yt_AZETzIE", "Puceau, moi ?"],
  "le-football-il-a-change": ["w5lq1PvT8Z0", "Le football, il a changé"],
  "vous-gardez-calme-vous-deviene-fous-l-origine-d-un-mème-culte-du-web-français": ["dXRrobPNd8A", "Vous gardez calme, vous devenez fous"],
  "ah-une-boule-de-neige": ["mn_L9bp_E3c", "Ah, une boule de neige"],
  "mon-sac-est-fait": ["G3cz5R2MgBw", "Mon sac est fait"],
  "ah-ils-mont-feinte": ["ts3ggmbCa-k", "Ah, ils m'ont feinté"],
  "tema-la-taille-du-rat": ["qIiauK_j9j0", "Téma la taille du rat"],
  "ah-le-gateau-il-etait-sec": ["hAqYOyPQBeI", "Ah le gâteau, il était sec"],
  "mais-tes-pas-net-baptiste": ["eHrUAizt2sE", "Mais t'es pas net Baptiste"],
  santebondyonestla: ["ZKIzTqvZf0o", "Santé Bondy, on est là"],
  memechenille: ["_S6xtImHLTc", "Une chenille !"],
  "un-petit-wrap": ["w36j6h9yrvQ", "Un petit wrap"],
  "sachez-que-je-vous-paierai-pas": ["K2PbbOFE5Xw", "Je vous paierai pas"],
  "un-peu-de-gazouz": ["V5l3q2JJYGg", "Un peu de gazouz, un peu de limonade"],
  "c-est-bon-pour-vous": ["qMjb97WA7tE", "Est-ce que c'est bon pour vous ?"],
  yapaswesh: ["hayquZv1p9Q", "Y'a pas wesh"],
  "jai-pas-commande-ça-mdr": ["CmXF8Ss8HXw", "J'ai pas commandé ça, MDR"],
  "fraise-framboise-myrtille": ["md0uDPfX0YI", "Fraise, framboise, myrtille"],
  "moi-tu-me-parles-pas-dage": ["ipn-UAVqZRU", "Moi, tu me parles pas d'âge"],
  "c-est-qui-brandon-euh-l-cousin": ["wjJorDxY178", "C'est qui Brandon ? Euh l'cousin"],
  "salam-aleykoum-les-patissiers": ["loNuCMF4M1c", "Salam aleykoum les pâtissiers"],
  "dans-ma-cabane-dans-ma-foret": ["Lf06nUZcEos", "Dans ma cabane, dans ma forêt"],
  "le-mode-zombie-ca-dechire": ["lRGmKEx8q4k", "Le mode zombie, ça déchire"],
  "attention-grenade": ["rN_uDDSuRaM", "Attention grenade, hop grenade dans la gueule"],
  "le-poulet-c-est-trop-bon": ["D84RthMlRM4", "Le poulet, c'est trop bon"],
  "je-suis-pas-venue-ici-pour-souffrir-ok": ["LtNY89lLE5g", "Je suis pas venue ici pour souffrir, OK ?"],
  "jaune-attend": ["zAF1E0JFzAU", "Qu'est-ce qui est jaune et qui attend ? Jonathan"],
  "la-mer-noire": ["0SdcfsD_WVE", "Question pour un champion — La Mer Noire"],
  "jadore-le-nutella": ["fFcdmrb44eI", "J'adore le Nutella"],
  "c-est-reparti-comme-en-46": ["bRKir2b-dYg", "C'est reparti comme en 46"],
  "non-mais-allo-quoi": ["mbsVSxQV2zo", "Non mais allô quoi"],
  "paillettes-dans-ma-vie-kevin": ["bgOfMDKe2tQ", "Mets des paillettes dans ma vie, Kevin"],
  "je-suis-un-peu-fatigué": ["Onji7XTEXlk", "C'est pas que j'en ai marre, mais je suis un peu fatigué"],
  "il-est-tombe": ["h2Ho9GOrrzc", "Il est tombé / Rends-moi mes chips"],
  "c-est-qui-le-patron": ["e7_-gGK6xAQ", "C'est qui le patron ?"],
  "point-faible-trop-fort": ["dlS141M3oMU", "Point faible : trop fort"],
  "t-es-triste-arrete": ["tKag5njHJJY", "T'es triste ? Arrête !"],
  "bisou-je-manvol": ["6TdsKCB2jkk", "Bisou, je m'envole"],
  "machtou-pichtou": ["WCEQ20w-TTo", "Machtou Pichtou"],
  "mais-c-était-sur-enfaite": ["oVO3M8X9ukM", "Mais c'était sûr en fait"],
  kayakobeme: ["Bcb_pMBLOf0", "Kayakobeme"],
  "c-est-mon-slibaard": ["ZtdIL5nrVAw", "C'est mon slibaard"],
  "tu-vas-repartir-mal-mon-copain": ["jXY5OkFJpEs", "Tu vas repartir mal, mon copain"],
  heuredefairedesbetises: ["J2MZw40mav8", "C'est l'heure de faire des bêtises"],
  "jadore-leau": ["a_OQtqHkt8E", "J'adore l'eau"],
  pasmalnoncestfrancais: ["FXs8e4vHo6c", "Pas mal, non ? C'est français"],
  unerobevreument: ["JJkx_uuPpQg", "Une robe vraiment"],
  "pet-pepite-de-chocolat": ["Hwdd7i8LzAY", "Pépite de chocolat"],
  ohsilvousplait: ["KdvRDccadhM", "Oh s'il vous plaît"],
  "descends-arrete-de-crier": ["MGOj2cpqN-g", "Descends !"],
  "salut-a-toi-jeune-entrepreneur": ["W422Pu4qKWY", "Salut à toi, jeune entrepreneur"],
  "pas-l-temps-de-niaiser": ["za_wqv0CI34", "Tequila, Heineken, pas le temps de niaiser"],
  chequedecaution: ["iFFXMBfeGNg", "Attention les chaises, y'a le chèque de caution"],
  ahjsuisbieng: ["vcl-8DW-9jc", "Ah, j'suis bieng"],
  cesttchaosqueezie: ["x_ktRjMvmLg", "C'est tchao"],
  "frappe-moi-je-t-empoisonne": ["EL8Tr7lqDKg", "Frappe-moi, je t'empoisonne"],
  "ah-bah-cest-bien-nils": ["esqxKBFA7dg", "Ah bah c'est bien Nils"],
  "ah-bah-j-suis-ravi": ["17kcbmrIGzY", "Ah bah j'suis ravi"],
  "ca-va-peter": ["xeMVn3vNt1A", "Ça va péter"],
};

const candidates = [
  ["mais-vous-fumez-monsieur", "Mais vous fumez monsieur ?", "Mais vous ___ ___ ?", "fumez monsieur"],
  ["eddymalou", "Mais oui, c'est clair !", "Mais oui, ___ ___ !", "c'est clair"],
  ["pas-mal-les-bzez", "Pas mal les bzez", "Pas mal ___ ___", "les bzez"],
  ["voila-jaime-bien", "Voilà, j'aime bien", "Voilà, ___ ___ ___", "j'aime bien"],
  ["sachez-que-je-vous-paierai-pas", "Je vous paierai pas", "Je vous ___ ___", "paierai pas"],
  ["je-pete-ma-biere-ma-libellule", "Je pète ma bière, ma libellule", "Je pète ma bière, ___ ___", "ma libellule"],
  ["appelez-les-hendek", "Appelez les hendek", "Appelez ___ ___", "les hendek"],
  ["un-peu-de-gazouz", "Un peu de gazouz, un peu de limonade", "Un peu de gazouz, ___ ___ ___ ___", "un peu de limonade"],
  ["combien-meme", "Combien ?!", "___ ?!", "Combien"],
  ["menu-whopper-pour-commencer", "Un menu Whopper là pour commencer", "Un menu Whopper là ___ ___", "pour commencer"],
  ["les-coutures-tiennent-pas", "Les coutures tiennent pas", "Les coutures ___ ___", "tiennent pas"],
  ["ya-pas-de-panneau", "Y'a pas de panneau", "Y'a pas ___ ___", "de panneau"],
  ["oh-putain-laurent", "Oh putain Laurent", "Oh putain ___", "Laurent"],
  ["puceau-moi-serieusement", "Puceau ? Moi ? Sérieusement ?", "Puceau ? Moi ? ___ ?", "Sérieusement"],
  ["c-est-bon-pour-vous", "Est-ce que c'est bon pour vous ?", "Est-ce que c'est ___ ___ ___ ?", "bon pour vous"],
  ["yapaswesh", "Y'a pas wesh", "Y'a pas ___", "wesh"],
  ["le-football-il-a-change", "Le football, il a changé", "Le football, ___ ___ ___", "il a changé"],
  ["vous-gardez-calme-vous-deviene-fous-l-origine-d-un-mème-culte-du-web-français", "Vous gardez calme, vous devenez fous", "Vous gardez calme, vous ___ ___", "devenez fous"],
  ["jai-pas-commande-ça-mdr", "J'ai pas commandé ça, MDR", "J'ai pas ___ ___, MDR", "commandé ça"],
  ["ah-une-boule-de-neige", "Ah, une boule de neige", "Ah, une ___ ___ ___", "boule de neige"],
  ["mon-sac-est-fait", "Mon sac est fait", "Mon sac ___ ___", "est fait"],
  ["ah-ils-mont-feinte", "Ah, ils m'ont feinté", "Ah, ils ___ ___", "m'ont feinté"],
  ["tema-la-taille-du-rat", "Téma la taille du rat", "Téma la taille ___ ___", "du rat"],
  ["ah-le-gateau-il-etait-sec", "Ah le gâteau, il était sec", "Ah le gâteau, ___ ___ ___", "il était sec"],
  ["fraise-framboise-myrtille", "Fraise, framboise, myrtille", "Fraise, framboise, ___", "myrtille"],
  ["travaille-pas-faignon", "Travaille pas, faignon !", "Travaille pas, ___ !", "faignon"],
  ["moi-tu-me-parles-pas-dage", "Moi, tu me parles pas d'âge", "Moi, tu me parles pas ___", "d'âge"],
  ["mais-tes-pas-net-baptiste", "Mais t'es pas net Baptiste ?", "Mais t'es pas ___ ___ ?", "net Baptiste"],
  ["santebondyonestla", "Santé Bondy, on est là", "Santé Bondy, ___ ___ ___", "on est là"],
  ["c-est-qui-brandon-euh-l-cousin", "C'est qui Brandon ? Euh, l'cousin", "C'est qui Brandon ? Euh, ___", "l'cousin"],
  ["salam-aleykoum-les-patissiers", "Salam aleykoum les pâtissiers", "Salam aleykoum ___ ___", "les pâtissiers"],
  ["dans-ma-cabane-dans-ma-foret", "Dans ma cabane, dans ma forêt", "Dans ma cabane, ___ ___ ___", "dans ma forêt"],
  ["fais-la-moula", "Fais la moula", "Fais ___ ___", "la moula"],
  ["le-mode-zombie-ca-dechire", "Le mode zombie, ça déchire !", "Le mode zombie, ___ ___ !", "ça déchire"],
  ["attention-grenade", "Attention grenade, hop grenade dans la gueule !", "Attention grenade, hop grenade ___ ___ ___ !", "dans la gueule"],
  ["le-poulet-c-est-trop-bon", "Le poulet, c'est trop bon !", "Le poulet, ___ ___ ___ !", "c'est trop bon"],
  ["je-suis-pas-venue-ici-pour-souffrir-ok", "Je suis pas venue ici pour souffrir, OK ?", "Je suis pas venue ici ___ ___, OK ?", "pour souffrir"],
  ["jaune-attend", "Qu'est-ce qui est jaune et qui attend ? Jonathan", "Qu'est-ce qui est jaune et qui attend ? ___", "Jonathan"],
  ["salut-mon-pote", "Salut mon pote", "Salut ___ ___", "mon pote"],
  ["la-mer-noire", "La Mer Noire", "La Mer ___", "Noire"],
  ["jadore-le-nutella", "J'adore le Nutella !", "J'adore ___ ___ !", "le Nutella"],
  ["c-est-reparti-comme-en-46", "C'est reparti comme en 46", "C'est reparti ___ ___ ___", "comme en 46"],
  ["non-mais-allo-quoi", "Non mais allô quoi", "Non mais ___ ___", "allô quoi"],
  ["paillettes-dans-ma-vie-kevin", "Mets des paillettes dans ma vie, Kevin !", "Mets des paillettes ___ ___ ___, Kevin !", "dans ma vie"],
  ["je-suis-un-peu-fatigué", "C'est pas que j'en ai marre, mais je suis un peu fatigué", "C'est pas que j'en ai marre, mais ___ ___ ___ ___ ___", "je suis un peu fatigué"],
  ["il-est-tombe", "Il est tombé, mon corps il est gracieux", "Il est tombé, mon corps ___ ___ ___", "il est gracieux"],
  ["il-est-tombe", "Rends-moi mes chips", "Rends-moi ___ ___", "mes chips"],
  ["c-est-qui-le-patron", "C'est qui le patron ?", "C'est qui ___ ___ ?", "le patron"],
  ["point-faible-trop-fort", "Point faible : trop fort", "Point faible : ___ ___", "trop fort"],
  ["t-es-triste-arrete", "T'es triste ? Arrête !", "T'es triste ? ___ !", "Arrête"],
  ["bisou-je-manvol", "Bisou, je m'envole", "Bisou, ___ ___", "je m'envole"],
  ["machtou-pichtou", "Machtu Pichtou", "Machtu ___", "Pichtou"],
  ["mais-c-était-sur-enfaite", "Mais c'était sûr en fait !", "Mais c'était ___ ___ ___ !", "sûr en fait"],
  ["kayakobeme", "Kayakobeme", "___", "Kayakobeme"],
  ["c-est-mon-slibaard", "C'est mon slibaard !", "C'est mon ___ !", "slibaard"],
  ["tu-vas-repartir-mal-mon-copain", "Tu vas repartir mal, mon copain", "Tu vas repartir mal, ___ ___", "mon copain"],
  ["heuredefairedesbetises", "C'est l'heure de faire des bêtises", "C'est l'heure de faire ___ ___", "des bêtises"],
  ["jadore-leau", "J'adore l'eau", "J'adore ___", "l'eau"],
  ["pasmalnoncestfrancais", "Pas mal, non ? C'est français !", "Pas mal, non ? ___ ___ !", "C'est français"],
  ["unerobevreument", "Une robe vraiiiment", "Une robe ___", "vraiiiment"],
  ["pet-pepite-de-chocolat", "Pépite de chocolat", "Pépite ___ ___", "de chocolat"],
  ["memepasunpeu", "Même pas un peu", "Même pas ___ ___", "un peu"],
  ["ouvrenicole", "Ouvre Nicole", "Ouvre ___", "Nicole"],
  ["ohsilvousplait", "Oh s'il vous plaît !", "Oh ___ ___ ___ !", "s'il vous plaît"],
  ["top7fave", "Top 7 favééé", "Top 7 ___", "favééé"],
  ["descends-arrete-de-crier", "Descends !", "___ !", "Descends"],
  ["salut-a-toi-jeune-entrepreneur", "Salut à toi, jeune entrepreneur", "Salut à toi, ___ ___", "jeune entrepreneur"],
  ["pas-l-temps-de-niaiser", "Tequila, Heineken, pas le temps de niaiser", "Tequila, Heineken, pas le temps ___ ___", "de niaiser"],
  ["chequedecaution", "Attention les chaises, y'a le chèque de caution !", "Attention les chaises, y'a ___ ___ ___ ___ !", "le chèque de caution"],
  ["memechenille", "Une chenille !", "Une ___ !", "chenille"],
  ["ahjsuisbieng", "Ah, j'suis bieng", "Ah, ___ ___", "j'suis bieng"],
  ["un-petit-wrap", "Un petit wrap", "Un petit ___", "wrap"],
  ["cestlecantine", "C'est le cantine !", "C'est ___ ___ !", "le cantine"],
  ["cesttchaosqueezie", "C'est tchao !", "C'est ___ !", "tchao"],
  ["frappe-moi-je-t-empoisonne", "Frappe-moi, je t'empoisonne", "Frappe-moi, ___ ___", "je t'empoisonne"],
  ["ah-bah-cest-bien-nils", "Ah bah c'est bien Nils", "Ah bah c'est bien ___", "Nils"],
  ["ah-bah-j-suis-ravi", "Ah bah j'suis ravi !", "Ah bah ___ ___ !", "j'suis ravi"],
  ["ca-va-peter", "Ça va péter !", "Ça va ___ !", "péter"],
].map(([slug, title, question, answer]) => ({ slug, title, question, answer }));

// No trustworthy YouTube match was found for these entries. Keeping them out
// is safer than importing an unrelated image/video into the quiz.
const excludedSlugs = new Set([
  "travaille-pas-faignon",
  "fais-la-moula",
  "salut-mon-pote",
  "memepasunpeu",
  "ouvrenicole",
  "top7fave",
  "cestlecantine",
]);
const selectedCandidates = candidates.filter((candidate) => !excludedSlugs.has(candidate.slug));

const normalize = (value) => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

const stopWords = new Set([
  "a", "au", "aux", "avec", "c", "ca", "ce", "ces", "d", "dans", "de", "des", "du",
  "elle", "en", "est", "et", "il", "j", "je", "l", "la", "le", "les", "m", "ma", "mais",
  "me", "mes", "moi", "mon", "ne", "non", "on", "ou", "pas", "pour", "qu", "que", "qui",
  "s", "sa", "se", "ses", "son", "sur", "t", "ta", "te", "tes", "toi", "ton", "tu", "un",
  "une", "vous", "y",
]);

function significantTokens(value) {
  return normalize(value).split(" ").filter((token) => token.length > 1 && !stopWords.has(token));
}

function parseDuration(value = "") {
  const parts = value.split(":").map(Number);
  if (parts.some(Number.isNaN)) return null;
  return parts.reduce((seconds, part) => seconds * 60 + part, 0);
}

function collectVideoRenderers(value, output = []) {
  if (!value || typeof value !== "object") return output;
  if (value.videoRenderer) {
    const video = value.videoRenderer;
    output.push({
      id: video.videoId,
      title: video.title?.runs?.map((run) => run.text).join("") ?? "",
      duration: parseDuration(video.lengthText?.simpleText),
    });
  }
  for (const child of Object.values(value)) collectVideoRenderers(child, output);
  return output;
}

function extractInitialData(html) {
  const markers = ["var ytInitialData = ", "ytInitialData = "];
  for (const marker of markers) {
    const markerIndex = html.indexOf(marker);
    if (markerIndex === -1) continue;
    const start = html.indexOf("{", markerIndex + marker.length);
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let index = start; index < html.length; index++) {
      const char = html[index];
      if (inString) {
        if (escaped) escaped = false;
        else if (char === "\\") escaped = true;
        else if (char === '"') inString = false;
        continue;
      }
      if (char === '"') inString = true;
      else if (char === "{") depth++;
      else if (char === "}" && --depth === 0) return JSON.parse(html.slice(start, index + 1));
    }
  }
  throw new Error("Réponse YouTube illisible");
}

async function findYoutubeVideo(candidate) {
  const verified = verifiedVideos[candidate.slug];
  if (verified) return { id: verified[0], title: verified[1], duration: null, coverage: 1, score: 2 };

  const query = `${candidate.title} meme original`;
  let response;
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      response = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
          "Accept-Language": "fr-FR,fr;q=0.9",
        },
        signal: AbortSignal.timeout(15_000),
      });
      if (response.ok) break;
      lastError = new Error(`YouTube HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, attempt * 2500));
  }
  if (!response?.ok) throw lastError ?? new Error("YouTube indisponible");

  const videos = collectVideoRenderers(extractInitialData(await response.text()));
  const expected = normalize(candidate.title).split(" ").filter((token) => token.length > 1);
  const normalizedAnswer = normalize(candidate.answer);

  const ranked = videos.map((video) => {
    const normalizedTitle = normalize(video.title);
    const actual = new Set(normalizedTitle.split(" "));
    const matches = expected.filter((token) => actual.has(token)).length;
    const coverage = expected.length ? matches / expected.length : 0;
    const shortBonus = video.duration !== null && video.duration <= 180 ? 0.15 : 0;
    const refBonus = /original|m[eè]me|ref|culte|extrait/i.test(video.title) ? 0.08 : 0;
    const answerBonus = normalizedTitle.includes(normalizedAnswer) ? 0.2 : 0;
    return { ...video, coverage, score: coverage + shortBonus + refBonus + answerBonus };
  }).sort((a, b) => b.score - a.score);

  const best = ranked[0];
  if (!best || best.coverage < 0.65) return null;
  return best;
}

function createDistractors(candidate) {
  const wordCount = normalize(candidate.answer).split(" ").length;
  const closeMatches = candidates.filter((other) => {
    if (other === candidate || normalize(other.answer) === normalize(candidate.answer)) return false;
    const otherCount = normalize(other.answer).split(" ").length;
    return Math.abs(otherCount - wordCount) <= 1;
  });
  const seed = [...candidate.slug].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const fallback = candidates.filter((other) =>
    other !== candidate && normalize(other.answer) !== normalize(candidate.answer)
  );
  const unique = [...new Map([...closeMatches, ...fallback].map((other) => [normalize(other.answer), other])).values()];
  unique.sort((left, right) => {
    const leftScore = [...left.slug].reduce((sum, char) => sum + char.charCodeAt(0), seed);
    const rightScore = [...right.slug].reduce((sum, char) => sum + char.charCodeAt(0), seed);
    return (leftScore % 997) - (rightScore % 997);
  });
  return unique.slice(0, 6).map((other) => other.answer);
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      try {
        results[index] = await mapper(items[index], index);
      } catch (error) {
        results[index] = { candidate: items[index], error: error instanceof Error ? error.message : String(error) };
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}

const resolved = await mapWithConcurrency(selectedCandidates, 2, async (candidate) => {
  const video = await findYoutubeVideo(candidate);
  if (!verifiedVideos[candidate.slug]) await new Promise((resolve) => setTimeout(resolve, 900));
  console.log(`VÉRIFIÉE\t${candidate.title}\t${video ? video.title : "sans correspondance"}`);
  return { candidate, video };
});

for (const result of resolved) {
  if (result.error) {
    console.log(`ERREUR\t${result.candidate.title}\t${result.error}`);
  } else if (!result.video) {
    console.log(`SANS VIDEO\t${result.candidate.title}`);
  } else {
    console.log(`OK\t${result.candidate.title}\t${result.video.title}\thttps://youtu.be/${result.video.id}`);
  }
}

const ready = resolved.filter((result) => result.video).map(({ candidate, video }) => ({ candidate, video }));
console.log(`\n${ready.length}/${selectedCandidates.length} références prêtes.`);

if (!APPLY) {
  console.log("Aucune écriture effectuée. Relancer avec --apply après vérification.");
  process.exit(0);
}

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL manquante");
const sql = postgres(process.env.DATABASE_URL, { max: 1 });

try {
  const existing = await sql`select title, correct_answer from refs`;
  const existingTitles = new Set(existing.map((row) => normalize(row.title)));
  const existingAnswers = new Set(existing.map((row) => normalize(row.correct_answer ?? "")).filter(Boolean));
  let inserted = 0;
  let skipped = 0;

  await sql.begin(async (transaction) => {
    for (const { candidate, video } of ready) {
      if (existingTitles.has(normalize(candidate.title)) || existingAnswers.has(normalize(candidate.answer))) {
        console.log(`DOUBLON\t${candidate.title}`);
        skipped++;
        continue;
      }

      const [created] = await transaction`
        insert into refs (
          title, question, correct_answer, media_type, media_url, media_public_id,
          thumbnail_url, youtube_url, status
        ) values (
          ${candidate.title}, ${candidate.question}, ${candidate.answer}, 'image',
          ${`https://img.youtube.com/vi/${video.id}/hqdefault.jpg`},
          ${`youtube:${video.id}`},
          ${`https://img.youtube.com/vi/${video.id}/hqdefault.jpg`},
          ${`https://www.youtube.com/watch?v=${video.id}`},
          'approved'
        ) returning id
      `;

      const distractors = createDistractors(candidate);
      await transaction`
        insert into ref_propositions (ref_id, text)
        select ${created.id}::uuid, proposition
        from unnest(${transaction.array(distractors)}::text[]) as proposition
      `;
      existingTitles.add(normalize(candidate.title));
      existingAnswers.add(normalize(candidate.answer));
      inserted++;
    }
  });

  console.log(`Import terminé : ${inserted} ajoutées, ${skipped} doublons ignorés.`);
} finally {
  await sql.end();
}
