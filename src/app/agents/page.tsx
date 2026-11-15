import type { Metadata } from "next";
import { marked } from "marked";
import { readAgentDocs } from "@/lib/agent-docs";
import { pageMeta } from "@/lib/seo";
import { CARD, PageHeading } from "@/components/site/PageHeading";

export const metadata: Metadata = pageMeta({
  title: "Dành cho AI agent",
  description: "Cách admin và AI agent dùng CLI hopamfree hoặc HTTP API để import và đăng bài lên Hợp Âm Free.",
  path: "/agents",
});

export default async function AgentsPage() {
  // The README is our own file, not user input, so rendering its HTML is safe.
  const html = await marked.parse((await readAgentDocs()).replace(/^# .*\n/, ""));
  return (
    <main className="mx-auto max-w-[960px]">
      <PageHeading title="Dành cho AI agent">
        Admin đăng nhập một lần, rồi để agent cào và đăng bài qua CLI <code>hopamfree</code> hoặc HTTP API. Bản Markdown thô:{" "}
        <a className="underline" href="/agents.md">
          /agents.md
        </a>
      </PageHeading>
      <article className={`doc ${CARD}`} dangerouslySetInnerHTML={{ __html: html }} />
    </main>
  );
}
