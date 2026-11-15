import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { z } from "zod";
import * as schema from "./schema";
import { pgSsl } from "@/lib/pg";

const Env = z.object({ DATABASE_URL: z.string().min(1) });

export const databaseUrl = () => Env.parse(process.env).DATABASE_URL;

function connect() {
  const url = databaseUrl();
  return drizzle(postgres(url, { ssl: pgSsl(url), max: 5 }), { schema });
}

// One pool per server process; dev hot reload would otherwise open a new pool on every edit.
const globalDb = globalThis as { __db?: ReturnType<typeof connect> };
export function db() {
  globalDb.__db ??= connect();
  return globalDb.__db;
}
