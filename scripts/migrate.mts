// Applies drizzle/ migrations, then inserts seed songs whose slug is not taken yet. Safe to rerun.
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { songs } from "../src/db/schema";
import { SEED_SONGS } from "../src/db/seed-songs";
import { pgSsl } from "../src/lib/pg";
import { songColumns } from "../src/lib/song";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");
const client = postgres(url, { ssl: pgSsl(url), max: 1 });
const db = drizzle(client);

await migrate(db, { migrationsFolder: "drizzle" });
const inserted = await db.insert(songs).values(SEED_SONGS.map(songColumns)).onConflictDoNothing({ target: songs.slug }).returning({ slug: songs.slug });
console.log(`migrated; seeded ${inserted.length} new song(s)`);
await client.end();
