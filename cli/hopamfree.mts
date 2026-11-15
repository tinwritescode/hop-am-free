#!/usr/bin/env node
// hopamfree: admin CLI for Hợp Âm Free. Data goes to stdout as JSON, messages go to stderr,
// so an AI agent can pipe one command into the next. See cli/README.md.
import { spawn } from "node:child_process";
import { chmod, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { homedir, hostname } from "node:os";
import { join } from "node:path";
import { text as readAll } from "node:stream/consumers";
import { parseArgs } from "node:util";
import { z } from "zod";

const DEFAULT_URL = "https://hopam.tyvn.online";
const CONFIG_DIR = join(process.env.XDG_CONFIG_HOME ?? join(homedir(), ".config"), "hopamfree");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

const HELP = `hopamfree <command> [options]

  login [--no-browser]   Sign in as admin (approve the code on <url>/cli)
  logout                 Forget the local token (revoke it on <url>/cli)
  whoami                 Show the signed-in admin
  search [query]         Find songs already on the site (duplicate check)
  import <link>          Crawl a chord page; prints a song draft as JSON
  create <file|->        Publish a draft JSON (from import, edited) and print its path
  import-batch <file|->  Queue many links (one per line) to crawl and publish in the background
  jobs <batchId> [--watch]  Show a batch's progress and each link's result
  retry <batchId>        Re-queue the batch's failed imports

Options: --url <base> (or HOPAMFREE_URL), --watch, --help`;

const Config = z.object({ url: z.string(), token: z.string(), email: z.string() });
type Config = z.infer<typeof Config>;

const ErrorBody = z.object({ error: z.string(), slug: z.string().nullish() });

async function loadConfig(): Promise<Config | null> {
  const raw = await readFile(CONFIG_FILE, "utf8").catch(() => null);
  if (!raw) return null;
  const parsed = Config.safeParse(JSON.parse(raw));
  return parsed.success ? parsed.data : null;
}

async function saveConfig(config: Config) {
  await mkdir(CONFIG_DIR, { recursive: true, mode: 0o700 });
  await writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), { mode: 0o600 });
  await chmod(CONFIG_FILE, 0o600);
}

function say(message: string) {
  process.stderr.write(`${message}\n`);
}

function print(data: unknown) {
  process.stdout.write(`${JSON.stringify(data, null, 2)}\n`);
}

async function call<T>({ base, path, schema, token, body, method }: {
  base: string;
  path: string;
  schema: z.ZodType<T>;
  token?: string;
  body?: unknown;
  method?: "GET" | "POST";
}): Promise<{ status: number; data: T }> {
  const res = await fetch(new URL(path, base), {
    method: method ?? (body === undefined ? "GET" : "POST"),
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json: unknown = await res.json().catch(() => null);
  if (!res.ok && res.status !== 428) {
    const err = ErrorBody.safeParse(json);
    throw new Error(`HTTP ${res.status}: ${err.success ? err.data.error : res.statusText}${err.success && err.data.slug ? ` (slug: ${err.data.slug})` : ""}`);
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) throw new Error(`Unexpected response from ${path}: ${parsed.error.message}`);
  return { status: res.status, data: parsed.data };
}

function openBrowser(url: string) {
  const [cmd, args] = process.platform === "darwin" ? ["open", [url]] : process.platform === "win32" ? ["cmd", ["/c", "start", "", url]] : ["xdg-open", [url]];
  spawn(cmd, args, { stdio: "ignore", detached: true }).on("error", () => {}).unref();
}

async function login({ base, browser }: { base: string; browser: boolean }) {
  const { data: start } = await call({
    base,
    path: "/api/cli/device",
    body: { clientName: `hopamfree CLI (${hostname()})` },
    schema: z.object({ deviceCode: z.string(), userCode: z.string(), verificationUrl: z.string(), expiresAt: z.string(), intervalSeconds: z.number() }),
  });
  say(`Mã đăng nhập: ${start.userCode}\nMở trang này, đăng nhập admin và bấm "Cho phép":\n  ${start.verificationUrl}`);
  if (browser) openBrowser(start.verificationUrl);

  const deadline = Date.parse(start.expiresAt);
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, start.intervalSeconds * 1000));
    const { status, data } = await call({
      base,
      path: "/api/cli/token",
      body: { deviceCode: start.deviceCode },
      schema: z.union([z.object({ token: z.string(), email: z.string() }), z.object({ status: z.literal("pending") })]),
    });
    if (status === 200 && "token" in data) {
      await saveConfig({ url: base, token: data.token, email: data.email });
      say(`Đã đăng nhập: ${data.email}. Token lưu ở ${CONFIG_FILE}`);
      return print({ email: data.email, url: base });
    }
  }
  throw new Error("Hết hạn mã đăng nhập, chạy lại hopamfree login");
}

async function requireConfig(base: string): Promise<Config> {
  const config = await loadConfig();
  if (!config) throw new Error("Chưa đăng nhập. Chạy: hopamfree login");
  if (config.url !== base) throw new Error(`Token thuộc ${config.url}, không phải ${base}. Chạy: hopamfree login --url ${base}`);
  return config;
}

async function readDraft(source: string): Promise<unknown> {
  const text = source === "-" ? await readAll(process.stdin) : await readFile(source, "utf8");
  const json: unknown = JSON.parse(text);
  // Accept the whole `import` output as well as a bare draft.
  const wrapped = z.object({ draft: z.unknown() }).safeParse(json);
  return wrapped.success ? wrapped.data.draft : json;
}

const Batch = z.object({
  progress: z.object({ total: z.number(), done: z.number(), counts: z.record(z.string(), z.number()) }),
  jobs: z.array(z.unknown()),
});

async function watchBatch({ base, token, batchId, watch }: { base: string; token: string; batchId: string; watch: boolean }) {
  const path = `/api/jobs?batch=${encodeURIComponent(batchId)}`;
  for (;;) {
    const { data } = await call({ base, path, token, schema: Batch });
    const { total, done, counts } = data.progress;
    if (!watch || done >= total) return print(data);
    say(`${done}/${total} xong (đang chạy ${counts.active ?? 0}, chờ ${(counts.created ?? 0) + (counts.retry ?? 0)}, lỗi ${counts.failed ?? 0})`);
    await new Promise((r) => setTimeout(r, 5000));
  }
}

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: { url: { type: "string" }, "no-browser": { type: "boolean" }, watch: { type: "boolean", short: "w" }, help: { type: "boolean", short: "h" } },
  });
  const [command, arg] = positionals;
  const config = await loadConfig();
  const base = (values.url ?? process.env.HOPAMFREE_URL ?? config?.url ?? DEFAULT_URL).replace(/\/+$/, "");

  switch (command) {
    case "login":
      return login({ base, browser: !values["no-browser"] });
    case "logout":
      await rm(CONFIG_FILE, { force: true });
      return say(`Đã xoá token trên máy này. Thu hồi hẳn ở ${base}/cli`);
    case "whoami": {
      const { token } = await requireConfig(base);
      return print((await call({ base, path: "/api/cli/whoami", token, schema: z.object({ email: z.string(), isAdmin: z.boolean() }) })).data);
    }
    case "search": {
      const path = `/api/songs?q=${encodeURIComponent(arg ?? "")}`;
      return print((await call({ base, path, schema: z.object({ songs: z.array(z.unknown()) }) })).data.songs);
    }
    case "import": {
      if (!arg) throw new Error("Cần link: hopamfree import <link>");
      const { token } = await requireConfig(base);
      say("Đang cào và nhờ AI làm sạch bài (có thể mất ~30 giây)...");
      return print((await call({ base, path: "/api/import", token, body: { url: arg }, schema: z.object({ draft: z.unknown(), unknownChords: z.array(z.string()) }) })).data);
    }
    case "create": {
      if (!arg) throw new Error("Cần file draft JSON (hoặc - cho stdin): hopamfree create draft.json");
      const { token } = await requireConfig(base);
      const { data } = await call({ base, path: "/api/songs", token, body: await readDraft(arg), schema: z.object({ slug: z.string(), path: z.string() }) });
      say(`Đã đăng: ${base}${data.path} (AI đang gợi ý điệu ở nền)`);
      return print({ ...data, url: `${base}${data.path}` });
    }
    case "import-batch": {
      if (!arg) throw new Error("Cần file danh sách link (hoặc - cho stdin): hopamfree import-batch links.txt");
      const { token } = await requireConfig(base);
      const text = arg === "-" ? await readAll(process.stdin) : await readFile(arg, "utf8");
      const { data } = await call({
        base,
        path: "/api/jobs",
        token,
        body: { urls: text.split("\n") },
        schema: z.object({ batchId: z.string(), jobs: z.array(z.object({ url: z.string(), id: z.string().nullable() })), invalid: z.array(z.string()) }),
      });
      const skipped = data.jobs.filter((j) => j.id === null).length;
      say(`Đã xếp ${data.jobs.length - skipped} link vào hàng đợi${skipped ? `, ${skipped} link đang chạy sẵn nên bỏ qua` : ""}${data.invalid.length ? `, ${data.invalid.length} dòng không phải link` : ""}.`);
      say(`Theo dõi: hopamfree jobs ${data.batchId} --watch`);
      return print(data);
    }
    case "jobs": {
      if (!arg) throw new Error("Cần batchId: hopamfree jobs <batchId> [--watch]");
      const { token } = await requireConfig(base);
      return watchBatch({ base, token, batchId: arg, watch: Boolean(values.watch) });
    }
    case "retry": {
      if (!arg) throw new Error("Cần batchId: hopamfree retry <batchId>");
      const { token } = await requireConfig(base);
      return print((await call({ base, path: "/api/jobs/retry", token, body: { batchId: arg }, schema: z.object({ retried: z.number() }) })).data);
    }
    default:
      say(HELP);
      if (command && !values.help) process.exitCode = 2;
  }
}

main().catch((err: unknown) => {
  say(`Lỗi: ${err instanceof Error ? err.message : String(err)}`);
  process.exitCode = 1;
});
