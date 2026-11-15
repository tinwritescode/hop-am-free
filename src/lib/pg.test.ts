import { describe, expect, it } from "vitest";
import { pgSsl } from "./pg";

describe("pgSsl", () => {
  it("uses TLS without CA checks by default (Supabase signs with its own CA)", () => {
    expect(pgSsl("postgres://u:p@db.example.co:5432/postgres")).toEqual({ rejectUnauthorized: false });
  });

  it("turns TLS off when the URL asks for sslmode=disable (local Postgres)", () => {
    expect(pgSsl("postgres://postgres:postgres@localhost:55432/app?sslmode=disable")).toBe(false);
  });
});
