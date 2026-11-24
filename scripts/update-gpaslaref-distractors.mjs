import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local", quiet: true });

const APPLY = process.argv.includes("--apply");

const distractorsByTitle = {
  "Mais vous fumez monsieur ?": ["buvez monsieur", "plaisantez monsieur", "toussez monsieur", "rêvez monsieur", "dormez monsieur", "mangez monsieur"],
  "Mais oui, c'est clair !": ["c'est sûr", "je comprends", "bien entendu", "t'as raison", "sans problème", "pourquoi pas"],
  "Pas mal les bzez": ["les pecs", "les biceps", "les abdos", "les muscles", "les épaules", "les bras"],
  "Voilà, j'aime bien": ["ça me plaît", "c'est pas mal", "je valide ça", "ça passe bien", "j'adore ça", "on garde ça"],
  "Je vous paierai pas": ["rembourserai demain", "dois plus rien", "donnerai rien", "oublierai pas", "rappellerai demain", "promets rien"],
  "Je pète ma bière, ma libellule": ["mon papillon", "ma sauterelle", "mon petit cœur", "ma luciole", "ma grenouille", "mon hirondelle"],
  "Appelez les hendek": ["la police", "les pompiers", "les renforts", "les secours", "mes collègues", "les voisins"],
  "Un peu de gazouz, un peu de limonade": ["un peu de grenadine", "un verre de citronnade", "un peu de citron pressé", "un peu d'eau pétillante", "un fond de menthe à l'eau", "une dose de jus d'orange"],
  "Combien ?!": ["Pourquoi", "Comment", "Quand", "Où ça", "Sérieux", "Quoi"],
  "Un menu Whopper là pour commencer": ["pour bien débuter", "avant le dessert", "avec des frites", "et un Coca", "sans les oignons", "pour me caler"],
  "Les coutures tiennent pas": ["vont lâcher", "sont trop serrées", "craquent déjà", "ferment même pas", "sont mal faites", "vont pas tenir"],
  "Y'a pas de panneau": ["de sortie", "de passage", "de problème", "de signal", "de parking", "d'indication"],
  "Oh putain Laurent": ["Michel", "Patrick", "Kevin", "Julien", "Nicolas", "Baptiste"],
  "Puceau ? Moi ? Sérieusement ?": ["Franchement", "Vraiment", "Sans blague", "T'es sérieux", "Tu plaisantes", "À mon âge"],
  "Est-ce que c'est bon pour vous ?": ["clair pour vous", "fini pour vous", "assez pour vous", "mieux comme ça", "validé pour vous", "correct maintenant"],
  "Y'a pas wesh": ["moyen frère", "photo gros", "panneau ici", "de souci", "le temps", "d'embrouille"],
  "Le football, il a changé": ["c'était mieux avant", "va trop vite", "devient compliqué", "a bien évolué", "n'est plus pareil", "nous a quittés"],
  "Vous gardez calme, vous devenez fous": ["perdez la tête", "faites les malins", "partez en vrille", "criez très fort", "restez debout", "changez de ton"],
  "J'ai pas commandé ça, MDR": ["demandé ça", "choisi ça", "pris ça", "voulu ça", "payé ça", "validé ça"],
  "Ah, une boule de neige": ["pomme de pin", "grosse peluche", "balle de tennis", "boule de glace", "petite météorite", "noix de coco"],
  "Mon sac est fait": ["est prêt", "est bouclé", "reste ouvert", "est rempli", "est trop lourd", "vient de tomber"],
  "Ah, ils m'ont feinté": ["m'ont bien eu", "m'ont tout pris", "m'ont encore piégé", "m'ont fait courir", "m'ont laissé tomber", "m'ont vu venir"],
  "Téma la taille du rat": ["du chat", "du chien", "du mulot", "de la souris", "du hamster", "du cafard"],
  "Ah le gâteau, il était sec": ["il était trop cuit", "il avait aucun goût", "il était tout dur", "il manquait de crème", "il était vraiment froid", "il collait aux dents"],
  "Fraise, framboise, myrtille": ["cerise", "groseille", "mûre", "cassis", "vanille", "pistache"],
  "Moi, tu me parles pas d'âge": ["de taille", "de poids", "de niveau", "de respect", "de talent", "de vitesse"],
  "Mais t'es pas net Baptiste ?": ["bien Rémi", "sérieux Kevin", "prêt Thomas", "sobre Michel", "clair Nicolas", "normal Julien"],
  "Santé Bondy, on est là": ["on arrive", "ça va bien", "on vous voit", "on lâche rien", "tout est carré", "toujours debout"],
  "C'est qui Brandon ? Euh, l'cousin": ["mon voisin", "le frérot", "un collègue", "son beau-frère", "le patron", "un ancien"],
  "Salam aleykoum les pâtissiers": ["les cuisiniers", "les aventuriers", "les candidats", "les boulangers", "les gourmands", "les amis"],
  "Dans ma cabane, dans ma forêt": ["dans mon jardin", "près de la rivière", "au fond des bois", "sous les grands arbres", "dans la montagne", "loin de la ville"],
  "Le mode zombie, ça déchire !": ["c'est incroyable", "ça fait peur", "c'est trop bien", "ça rend fou", "ça va vite", "c'est la folie"],
  "Attention grenade, hop grenade dans la gueule !": ["sur la voiture", "dans le bunker", "derrière le mur", "sous la table", "dans la fenêtre", "sur le balcon"],
  "Le poulet, c'est trop bon !": ["c'est délicieux", "ça croustille bien", "c'est une dinguerie", "j'en veux encore", "ça sent trop bon", "c'est mon préféré"],
  "Je suis pas venue ici pour souffrir, OK ?": ["pour pleurer", "pour attendre", "pour perdre", "pour me battre", "pour travailler", "pour avoir peur"],
  "Qu'est-ce qui est jaune et qui attend ? Jonathan": ["un citron pressé", "un poussin patient", "une banane en retard", "un soleil au feu rouge", "un canari à l'arrêt", "Bob l'éponge"],
  "La Mer Noire": ["Rouge", "Morte", "Blanche", "Bleue", "Baltique", "Caspienne"],
  "J'adore le Nutella !": ["le chocolat", "la confiture", "les noisettes", "le caramel", "le beurre de cacahuète", "la pâte à tartiner"],
  "C'est reparti comme en 46": ["comme en quarante", "pour un tour", "de plus belle", "comme avant", "sans prévenir", "pour la revanche"],
  "Non mais allô quoi": ["sérieux quoi", "ça va quoi", "oh quoi", "tu plaisantes", "sans déconner", "réveille-toi"],
  "Mets des paillettes dans ma vie, Kevin !": ["dans mes yeux", "sur ma robe", "dans mon cœur", "sur ma journée", "dans mon salon", "sur mes rêves"],
  "C'est pas que j'en ai marre, mais je suis un peu fatigué": ["j'ai besoin de dormir", "je vais rentrer chez moi", "je manque de sommeil", "je suis vraiment épuisé", "je voudrais me reposer", "j'ai plus trop d'énergie"],
  "Il est tombé, mon corps il est gracieux": ["il est solide", "reste magnifique", "bouge tout seul", "n'a rien senti", "est très souple", "va très bien"],
  "Rends-moi mes chips": ["mon téléphone", "mes lunettes", "mon sandwich", "ma casquette", "mes clés", "mon goûter"],
  "C'est qui le patron ?": ["le chef", "le responsable", "le champion", "le cuisinier", "le directeur", "le meilleur"],
  "Point faible : trop fort": ["trop rapide", "trop drôle", "trop beau", "trop musclé", "trop intelligent", "trop puissant"],
  "T'es triste ? Arrête !": ["Souris", "Rigole", "Respire", "Relève-toi", "Pense à autre chose", "Va mieux"],
  "Bisou, je m'envole": ["je m'en vais", "je décolle", "je dois partir", "je disparais", "à plus tard", "je prends l'air"],
  "Machtu Pichtou": ["Machu Picchu", "Matchu Pitchu", "Machu Pichou", "Machtou Pichu", "Matou Pichtou", "Machu Pikachu"],
  "Mais c'était sûr en fait !": ["évident en vrai", "prévu depuis hier", "certain depuis le début", "pas possible en fait", "clair finalement", "logique en vrai"],
  "Kayakobeme": ["Kawabonga", "Kikakobé", "Yakalélé", "Kaboumé", "Kaya Kombi", "Kirikoumé"],
  "C'est mon slibaard !": ["caleçon", "pantalon", "pyjama", "short de bain", "slip préféré", "costume"],
  "Tu vas repartir mal, mon copain": ["mon garçon", "mon ami", "petit malin", "mon frère", "mon grand", "champion"],
  "C'est l'heure de faire des bêtises": ["la fête", "du bruit", "les idiots", "un carnage", "n'importe quoi", "les quatre cents coups"],
  "J'adore l'eau": ["le jus", "le lait", "la pluie", "la mer", "le soda", "le sirop"],
  "Pas mal, non ? C'est français !": ["C'est artisanal", "C'est fait maison", "C'est magnifique", "C'est local", "C'est du solide", "C'est parisien"],
  "Une robe vraiiiment": ["magnifique", "incroyable", "élégante", "originale", "splendide", "très jolie"],
  "Pépite de chocolat": ["de caramel", "de noisette", "de bonheur", "de vanille", "de cacao", "de biscuit"],
  "Oh s'il vous plaît !": ["mais arrêtez", "pas maintenant", "je vous en prie", "laissez-moi tranquille", "faites un effort", "soyez gentils"],
  "Descends !": ["Remonte", "Arrête", "Reviens", "Attends", "Avance", "Cours"],
  "Salut à toi, jeune entrepreneur": ["futur millionnaire", "grand investisseur", "petit travailleur", "nouveau patron", "jeune ambitieux", "créateur de richesse"],
  "Tequila, Heineken, pas le temps de niaiser": ["de discuter", "de traîner", "de rigoler", "de réfléchir", "de se poser", "de faire la fête"],
  "Attention les chaises, y'a le chèque de caution !": ["le propriétaire qui arrive", "la table qui va casser", "le voisin du dessous", "le canapé tout neuf", "la caution à récupérer", "le ménage à refaire"],
  "Une chenille !": ["limace", "sauterelle", "coccinelle", "libellule", "araignée", "petite fourmi"],
  "Ah, j'suis bieng": ["je suis posé", "ça fait du bien", "je suis tranquille", "on est bien là", "j'suis refait", "je revis"],
  "Un petit wrap": ["tacos", "sandwich", "kebab", "burger", "panini", "burrito"],
  "C'est tchao !": ["fini", "terminé", "mort", "ciao", "parti", "dehors"],
  "Frappe-moi, je t'empoisonne": ["je te poursuis", "je te dénonce", "je me défends", "je te maudis", "tu vas regretter", "je rends les coups"],
  "Ah bah c'est bien Nils": ["Kevin", "Lucas", "Hugo", "Baptiste", "Thomas", "Nicolas"],
  "Ah bah j'suis ravi !": ["je suis content", "ça me fait plaisir", "c'est une bonne nouvelle", "je suis rassuré", "tant mieux alors", "c'est formidable"],
  "Ça va péter !": ["exploser", "craquer", "chauffer", "partir", "faire du bruit", "mal finir"],
};

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL absent de .env.local");
}

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

try {
  const refs = await sql`
    select id, title, correct_answer
    from refs
    where media_public_id like 'youtube:%'
    order by title
  `;

  const databaseTitles = new Set(refs.map((ref) => ref.title));
  const configuredTitles = Object.keys(distractorsByTitle);
  const missing = refs.filter((ref) => !distractorsByTitle[ref.title]).map((ref) => ref.title);
  const extra = configuredTitles.filter((title) => !databaseTitles.has(title));

  if (refs.length !== 71 || configuredTitles.length !== 71 || missing.length || extra.length) {
    throw new Error(JSON.stringify({ databaseCount: refs.length, configuredCount: configuredTitles.length, missing, extra }, null, 2));
  }

  for (const ref of refs) {
    const choices = distractorsByTitle[ref.title];
    const uniqueChoices = new Set(choices.map((choice) => choice.trim().toLocaleLowerCase("fr")));
    if (choices.length !== 6 || uniqueChoices.size !== 6) {
      throw new Error(`${ref.title}: six distracteurs uniques sont requis`);
    }
    if (uniqueChoices.has(ref.correct_answer.trim().toLocaleLowerCase("fr"))) {
      throw new Error(`${ref.title}: la bonne réponse figure parmi les distracteurs`);
    }
  }

  if (!APPLY) {
    console.log(`Validation OK : ${refs.length} refs et ${refs.length * 6} distracteurs prêts.`);
    console.log("Relancez avec --apply pour mettre à jour la base.");
    process.exitCode = 0;
  } else {
    await sql.begin(async (transaction) => {
      for (const ref of refs) {
        await transaction`delete from ref_propositions where ref_id = ${ref.id}`;
        for (const text of distractorsByTitle[ref.title]) {
          await transaction`insert into ref_propositions (ref_id, text) values (${ref.id}, ${text})`;
        }
      }
    });

    const storedChoices = await sql`
      select refs.title, ref_propositions.text
      from refs
      join ref_propositions on ref_propositions.ref_id = refs.id
      where refs.media_public_id like 'youtube:%'
      order by refs.title, ref_propositions.text
    `;
    const storedByTitle = Object.groupBy(storedChoices, (choice) => choice.title);
    const mismatches = refs.flatMap((ref) => {
      const expected = [...distractorsByTitle[ref.title]].sort();
      const actual = (storedByTitle[ref.title] ?? []).map((choice) => choice.text).sort();
      return JSON.stringify(actual) === JSON.stringify(expected) ? [] : [{ title: ref.title, expected, actual }];
    });
    if (storedChoices.length !== 426 || mismatches.length) {
      throw new Error(`Vérification échouée : ${JSON.stringify({ count: storedChoices.length, mismatches }, null, 2)}`);
    }
    console.log(`Mise à jour terminée : ${storedChoices.length} distracteurs personnalisés sur ${refs.length} refs.`);
  }
} finally {
  await sql.end();
}
