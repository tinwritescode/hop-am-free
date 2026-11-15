// Starts the job queue workers once per server process. On in production; in dev only with JOBS_WORKER=1,
// because .env.local points at the production database and a dev worker would steal its jobs.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NEXT_PHASE === "phase-production-build") return;
  const enabled = process.env.JOBS_WORKER ? process.env.JOBS_WORKER === "1" : process.env.NODE_ENV === "production";
  if (!enabled) return;
  const { startWorkers } = await import("./jobs/worker");
  // Not awaited: a database hiccup at boot must not keep the site from serving pages.
  startWorkers().catch((err: unknown) => console.error("job workers failed to start", { err: err instanceof Error ? err.message : String(err) }));
}
