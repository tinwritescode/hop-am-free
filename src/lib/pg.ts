/** TLS options for both Postgres drivers (postgres-js for the app, node-postgres inside pg-boss). */
export function pgSsl(url: string): false | { rejectUnauthorized: false } {
  return new URL(url).searchParams.get("sslmode") === "disable" ? false : { rejectUnauthorized: false };
}
