import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/** cli/README.md is the single source for the agent docs, served as /agents (HTML) and /agents.md (raw). */
export function readAgentDocs(): Promise<string> {
  return readFile(join(process.cwd(), "cli/README.md"), "utf8");
}
