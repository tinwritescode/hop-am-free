import type { Metadata } from "next";
import { marked } from "marked";
import { readAgentDocs } from "@/lib/agent-docs";
import { SiteHeader } from "@/components/SiteHeader";
import { ForestFooter, SkyBand } from "@/components/Scenery";

export const metadata: Metadata = {
  title: "Dành cho AI agent",
  description: "Cách admin và AI agent dùng CLI hopamfree hoặc HTTP API để import và đăng bài lên Hợp Âm Free.",
};

export default async function AgentsPage() {
  // The README is our own file, not user input, so rendering its HTML is safe.
  const html = await marked.parse((await readAgentDocs()).replace(/^# .*\n/, ""));
  return (
    <>
      <SkyBand>
        <SiteHeader />
        <section className="mx-auto max-w-[1280px] px-4 pt-8 pb-32 sm:px-8">
          <h1 className="font-serif text-4xl font-bold text-[#16301f] sm:text-[48px]">Dành cho AI agent</h1>
          <p className="mt-2 max-w-[620px] text-[16px] font-semibold text-[#2e4a3a]">
            Admin đăng nhập một lần, rồi để agent cào và đăng bài qua CLI <code>hopamfree</code> hoặc HTTP API. Bản Markdown thô: <a className="underline" href="/agents.md">/agents.md</a>
          </p>
        </section>
      </SkyBand>
      <main className="relative mx-auto -mt-24 max-w-[960px] px-4 pb-16 sm:px-8">
        <article
          className="doc rounded-[26px] bg-white p-5 shadow-[0_1px_0_#dce8d8,0_12px_32px_rgba(47,107,71,0.10)] sm:p-8"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </main>
      <ForestFooter />
    </>
  );
}
