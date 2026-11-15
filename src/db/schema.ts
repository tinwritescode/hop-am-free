import { sql } from "drizzle-orm";
import { check, integer, jsonb, pgTable, primaryKey, serial, text, timestamp } from "drizzle-orm/pg-core";

export const songs = pgTable("songs", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  composer: text("composer").notNull().default(""),
  key: text("key").notNull(),
  genre: text("genre").notNull().default(""),
  /** The rhythm the source sheet names; AI suggestions live in song_rhythms. */
  rhythm: text("rhythm").notNull().default(""),
  contributor: text("contributor").notNull(),
  /** Raw chord sheet: `## Section` headings, chords inline as `[C]` before the word. */
  sheet: text("sheet").notNull(),
  sourceUrl: text("source_url"),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  /** Fret 0–11 the capo sits on; null = unknown. Read through capoFromColumns (src/lib/capo.ts). */
  capo: integer("capo"),
  /** Who set `capo`: sheet, ai or editor. `editor` with a null capo means an admin marked it unknown on purpose. */
  capoSource: text("capo_source"),
}, (t) => [
  check(
    "songs_capo_check",
    sql`(${t.capo} IS NULL AND (${t.capoSource} IS NULL OR ${t.capoSource} = 'editor')) OR (${t.capo} BETWEEN 0 AND 11 AND ${t.capoSource} IN ('sheet', 'ai', 'editor'))`,
  ),
]);

/** One strumming/picking version of a rhythm (điệu). AI creates a row the first time a song needs a rhythm nobody has yet. */
export const rhythms = pgTable("rhythms", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  timeSignature: text("time_signature").notNull(),
  subdivision: integer("subdivision").notNull(),
  bpm: integer("bpm").notNull(),
  steps: jsonb("steps").notNull(),
  feel: text("feel").notNull(),
  howTo: text("how_to").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const songRhythms = pgTable(
  "song_rhythms",
  {
    songId: integer("song_id")
      .notNull()
      .references(() => songs.id, { onDelete: "cascade" }),
    rhythmId: integer("rhythm_id")
      .notNull()
      .references(() => rhythms.id, { onDelete: "cascade" }),
    rank: integer("rank").notNull(),
    reason: text("reason").notNull(),
  },
  (t) => [primaryKey({ columns: [t.songId, t.rhythmId] })],
);

/** Display settings for signed-in users; anonymous users keep theirs in localStorage. */
export const userSettings = pgTable("user_settings", {
  userId: text("user_id").primaryKey(),
  settings: jsonb("settings").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Results of slow or paid calls (AI tasks, imports), keyed by what they were computed from. */
export const aiCache = pgTable("ai_cache", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Pending `hopamfree login` requests (device flow). Approved on the /cli page, consumed once by the CLI. */
export const cliLogins = pgTable("cli_logins", {
  deviceHash: text("device_hash").primaryKey(),
  userCode: text("user_code").notNull().unique(),
  clientName: text("client_name").notNull(),
  userId: text("user_id"),
  email: text("email"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

/** CLI tokens; only the SHA-256 is stored. Issued to admins only. */
export const apiTokens = pgTable("api_tokens", {
  id: serial("id").primaryKey(),
  tokenHash: text("token_hash").notNull().unique(),
  userId: text("user_id").notNull(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
});
