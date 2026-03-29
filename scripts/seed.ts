import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { refs, refPropositions } from "../lib/db/schema";

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client);

const testRefs = [
  {
    title: "Le Harlem Shake",
    question: "Cette danse virale s'appelle le ___",
    correctAnswer: "Harlem Shake",
    mediaUrl: "https://i.imgur.com/8b9HYLK.gif",
    mediaType: "image" as const,
    falseProps: ["Gangnam Style", "Dougie", "Running Man", "Macarena", "Nae Nae", "Wobble"],
  },
  {
    title: "Nabila",
    question: "Cette candidate de télé-réalité s'appelle ___",
    correctAnswer: "Nabila",
    mediaUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Placeholder_view_vector.svg/640px-Placeholder_view_vector.svg.png",
    mediaType: "image" as const,
    falseProps: ["Ayem", "Shanna", "Camille", "Sofiane", "Lucie", "Amélie"],
  },
  {
    title: "Norman fait des vidéos",
    question: "Ce YouTubeur français s'appelle ___",
    correctAnswer: "Norman",
    mediaUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Placeholder_view_vector.svg/640px-Placeholder_view_vector.svg.png",
    mediaType: "image" as const,
    falseProps: ["Cyprien", "Squeezie", "Rire Jaune", "Pierre Croce", "Natoo", "Amixem"],
  },
  {
    title: "Le Chat Nyan Cat",
    question: "Ce mème de chat pixelisé s'appelle le ___",
    correctAnswer: "Nyan Cat",
    mediaUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Placeholder_view_vector.svg/640px-Placeholder_view_vector.svg.png",
    mediaType: "image" as const,
    falseProps: ["Keyboard Cat", "Grumpy Cat", "Longcat", "Ceiling Cat", "Business Cat", "Lil Bub"],
  },
  {
    title: "Cyprien",
    question: "Ce vidéaste français connu pour ses parodies s'appelle ___",
    correctAnswer: "Cyprien",
    mediaUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Placeholder_view_vector.svg/640px-Placeholder_view_vector.svg.png",
    mediaType: "image" as const,
    falseProps: ["Norman", "Squeezie", "Antoine Daniel", "Amixem", "Jdg", "Mister V"],
  },
  {
    title: "Squeezie",
    question: "Ce streamer gaming français s'appelle ___",
    correctAnswer: "Squeezie",
    mediaUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Placeholder_view_vector.svg/640px-Placeholder_view_vector.svg.png",
    mediaType: "image" as const,
    falseProps: ["Gotaga", "Inoxtag", "Domingo", "Zerator", "Ponce", "Alphacast"],
  },
  {
    title: "Gangnam Style",
    question: "Ce clip viral de PSY s'appelle le ___",
    correctAnswer: "Gangnam Style",
    mediaUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Placeholder_view_vector.svg/640px-Placeholder_view_vector.svg.png",
    mediaType: "image" as const,
    falseProps: ["Harlem Shake", "Macarena", "PPAP", "Baby Shark", "Chicken Dance", "Kiki Challenge"],
  },
  {
    title: "Les Shadoks",
    question: "Cette série d'animation française des années 60 s'appelle les ___",
    correctAnswer: "Shadoks",
    mediaUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Placeholder_view_vector.svg/640px-Placeholder_view_vector.svg.png",
    mediaType: "image" as const,
    falseProps: ["Barbapapa", "Minipouss", "Schtroumpfs", "Dalton", "Zinzins", "Wunschpunsch"],
  },
  {
    title: "Doge",
    question: "Ce chien Shiba Inu devenu mème s'appelle ___",
    correctAnswer: "Doge",
    mediaUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Placeholder_view_vector.svg/640px-Placeholder_view_vector.svg.png",
    mediaType: "image" as const,
    falseProps: ["Cheems", "Walter", "Doggo", "Pupper", "Bork", "Floofer"],
  },
  {
    title: "Jean-Michel Aphatie",
    question: "Ce journaliste politique français s'appelle ___",
    correctAnswer: "Aphatie",
    mediaUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Placeholder_view_vector.svg/640px-Placeholder_view_vector.svg.png",
    mediaType: "image" as const,
    falseProps: ["Pujadas", "Ruquier", "Barthes", "Ardisson", "Drucker", "Delahousse"],
  },
];

async function seed() {
  console.log("Seeding test refs...");

  for (const ref of testRefs) {
    const [inserted] = await db.insert(refs).values({
      title: ref.title,
      question: ref.question,
      correctAnswer: ref.correctAnswer,
      mediaUrl: ref.mediaUrl,
      mediaPublicId: `seed/${ref.title.toLowerCase().replace(/\s+/g, "-")}`,
      mediaType: ref.mediaType,
      status: "approved",
    }).returning();

    await db.insert(refPropositions).values(
      ref.falseProps.map((text) => ({ refId: inserted.id, text }))
    );

    console.log(`✓ ${ref.title}`);
  }

  console.log("\n✅ Seed terminé ! 10 refs approuvées ajoutées.");
  await client.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
