import { readAgentDocs } from "@/lib/agent-docs";

export const dynamic = "force-static";

export async function GET() {
  return new Response(await readAgentDocs(), { headers: { "content-type": "text/markdown; charset=utf-8" } });
}
