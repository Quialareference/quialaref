import {
  pgTable,
  text,
  uuid,
  timestamp,
  integer,
  boolean,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { AdapterAccountType } from "next-auth/adapters";

// ─── Auth (NextAuth Drizzle Adapter) ────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  username: text("username").unique(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [primaryKey({ columns: [account.provider, account.providerAccountId] })]
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);

// ─── References ──────────────────────────────────────────────────────────────

export const refs = pgTable("refs", {
  id: uuid("id").primaryKey().defaultRandom(),
  submittedBy: uuid("submitted_by").references(() => users.id, { onDelete: "set null" }),
  title: text("title").notNull(), // Full name of the ref
  question: text("question"), // Sentence with ___ placeholder, e.g. "Cette danse s'appelle ___"
  correctAnswer: text("correct_answer"), // The word/phrase that fills the blank
  mediaType: text("media_type", { enum: ["image", "video"] }).notNull(),
  mediaUrl: text("media_url").notNull(),
  mediaPublicId: text("media_public_id").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  youtubeUrl: text("youtube_url"),
  status: text("status", { enum: ["pending", "approved", "rejected"] })
    .notNull()
    .default("pending"),
  playCount: integer("play_count").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const refPropositions = pgTable("ref_propositions", {
  id: uuid("id").primaryKey().defaultRandom(),
  refId: uuid("ref_id")
    .notNull()
    .references(() => refs.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// ─── Wiki (prêt pour le futur) ───────────────────────────────────────────────

export const refWikiPages = pgTable("ref_wiki_pages", {
  id: uuid("id").primaryKey().defaultRandom(),
  refId: uuid("ref_id")
    .unique()
    .notNull()
    .references(() => refs.id, { onDelete: "cascade" }),
  content: text("content").notNull().default(""),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const refWikiRevisions = pgTable("ref_wiki_revisions", {
  id: uuid("id").primaryKey().defaultRandom(),
  wikiPageId: uuid("wiki_page_id")
    .notNull()
    .references(() => refWikiPages.id, { onDelete: "cascade" }),
  authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
  content: text("content").notNull(),
  editSummary: text("edit_summary"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// ─── Rooms & Game ─────────────────────────────────────────────────────────────

export const rooms = pgTable("rooms", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").unique().notNull(),
  status: text("status", { enum: ["waiting", "playing", "finished"] })
    .notNull()
    .default("waiting"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  finishedAt: timestamp("finished_at", { mode: "date" }),
});

export const roomPlayers = pgTable("room_players", {
  id: uuid("id").primaryKey().defaultRandom(),
  roomId: uuid("room_id")
    .notNull()
    .references(() => rooms.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  pseudonym: text("pseudonym").notNull(),
  finalScore: integer("final_score").notNull().default(0),
  rank: integer("rank"),
  joinedAt: timestamp("joined_at", { mode: "date" }).defaultNow().notNull(),
});

export const gameRounds = pgTable("game_rounds", {
  id: uuid("id").primaryKey().defaultRandom(),
  roomId: uuid("room_id")
    .notNull()
    .references(() => rooms.id, { onDelete: "cascade" }),
  refId: uuid("ref_id").references(() => refs.id, { onDelete: "set null" }),
  roundNumber: integer("round_number").notNull(),
  startedAt: timestamp("started_at", { mode: "date" }),
  endedAt: timestamp("ended_at", { mode: "date" }),
  optionA: text("option_a").notNull(),
  optionB: text("option_b").notNull(),
  optionC: text("option_c").notNull(),
  optionD: text("option_d").notNull(),
  correctOption: text("correct_option", { enum: ["a", "b", "c", "d"] }).notNull(),
});

export const playerAnswers = pgTable("player_answers", {
  id: uuid("id").primaryKey().defaultRandom(),
  roundId: uuid("round_id")
    .notNull()
    .references(() => gameRounds.id, { onDelete: "cascade" }),
  roomPlayerId: uuid("room_player_id")
    .notNull()
    .references(() => roomPlayers.id, { onDelete: "cascade" }),
  chosenOption: text("chosen_option", { enum: ["a", "b", "c", "d"] }).notNull(),
  isCorrect: boolean("is_correct").notNull(),
  responseTimeMs: integer("response_time_ms").notNull(),
  pointsEarned: integer("points_earned").notNull(),
  answeredAt: timestamp("answered_at", { mode: "date" }).defaultNow().notNull(),
});

// ─── Relations ───────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  refs: many(refs),
  roomPlayers: many(roomPlayers),
}));

export const refsRelations = relations(refs, ({ one, many }) => ({
  author: one(users, { fields: [refs.submittedBy], references: [users.id] }),
  propositions: many(refPropositions),
  wikiPage: one(refWikiPages, { fields: [refs.id], references: [refWikiPages.refId] }),
}));

export const refPropositionsRelations = relations(refPropositions, ({ one }) => ({
  ref: one(refs, { fields: [refPropositions.refId], references: [refs.id] }),
}));

export const refWikiPagesRelations = relations(refWikiPages, ({ one, many }) => ({
  ref: one(refs, { fields: [refWikiPages.refId], references: [refs.id] }),
  revisions: many(refWikiRevisions),
}));

export const refWikiRevisionsRelations = relations(refWikiRevisions, ({ one }) => ({
  page: one(refWikiPages, { fields: [refWikiRevisions.wikiPageId], references: [refWikiPages.id] }),
  author: one(users, { fields: [refWikiRevisions.authorId], references: [users.id] }),
}));

export const roomsRelations = relations(rooms, ({ many }) => ({
  players: many(roomPlayers),
  rounds: many(gameRounds),
}));

export const gameRoundsRelations = relations(gameRounds, ({ one, many }) => ({
  room: one(rooms, { fields: [gameRounds.roomId], references: [rooms.id] }),
  ref: one(refs, { fields: [gameRounds.refId], references: [refs.id] }),
  answers: many(playerAnswers),
}));
