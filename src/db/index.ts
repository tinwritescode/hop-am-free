import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { z } from "zod";
import * as schema from "./schema";

const Env = z.object({ DATABASE_URL: z.string().min(1) });

function connect() {
  const { DATABASE_URL } = Env.parse(process.env);
  return drizzle(postgres(DATABASE_URL, { ssl: "require", max: 5 }), { schema });
}

// One pool per server process; dev hot reload would otherwise open a new pool on every edit.
const globalDb = globalThis as { __db?: ReturnType<typeof connect> };
export function db() {
  globalDb.__db ??= connect();
  return globalDb.__db;
}
