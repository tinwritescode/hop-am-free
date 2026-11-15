import { describe, expect, it } from "vitest";
import { ImportOutcomeSchema, InvalidDraftError, runImport, type ImportDeps } from "./import-job";
import { toSong, type SongDraft } from "./song";

const URL_ = "https://hopam.example/bai-1";
const DRAFT = { title: "Nó", artist: "Thắng", composer: "", key: "Am", genre: "", rhythm: "", sheet: "Nó như thế [Am]này", capo: null };

function deps(over: Partial<ImportDeps> = {}): ImportDeps & { published: SongDraft[] } {
  const published: SongDraft[] = [];
  return {
    published,
    findBySourceUrl: async () => null,
    fetchPage: async () => ({ title: "Nó", description: "", text: "Nó như thế [Am]này" }),
    importSong: async () => DRAFT,
    publish: async (draft) => {
      published.push(draft);
      return { ok: true, song: toSong({ ...draft, id: 1, slug: "no", contributor: "admin", capo: null, capoSource: null }) };
    },
    ...over,
  };
}

describe("runImport", () => {
  it("publishes a clean draft with its source link", async () => {
    const d = deps();
    expect(await runImport({ url: URL_, deps: d })).toEqual({ kind: "published", slug: "no" });
    expect(d.published).toEqual([{ ...DRAFT, sourceUrl: URL_ }]);
  });

  it("stops at a link that is already on the site, without crawling", async () => {
    const d = deps({ findBySourceUrl: async () => ({ slug: "co-roi" }), fetchPage: () => Promise.reject(new Error("crawled")) });
    expect(await runImport({ url: URL_, deps: d })).toEqual({ kind: "duplicate", slug: "co-roi" });
  });

  it("holds a draft with unknown chords for review instead of publishing", async () => {
    const d = deps({ importSong: async () => ({ ...DRAFT, sheet: "[Am]la [Zz9]la" }) });
    const out = await runImport({ url: URL_, deps: d });
    expect(out).toMatchObject({ kind: "review", unknownChords: ["Zz9"], draft: { sourceUrl: URL_, sheet: "[Am]la [Zz9]la" } });
    expect(d.published).toEqual([]);
  });

  it("treats losing a publish race on the same link as a duplicate", async () => {
    const d = deps({ publish: async () => ({ ok: false, status: 409, error: "trùng", slug: "co-roi" }) });
    expect(await runImport({ url: URL_, deps: d })).toEqual({ kind: "duplicate", slug: "co-roi" });
  });

  it("holds a draft the site rejects for review, with the reason", async () => {
    const d = deps({ publish: async () => ({ ok: false, status: 400, error: "key: Tone dạng C" }) });
    expect(await runImport({ url: URL_, deps: d })).toMatchObject({ kind: "review", reason: "key: Tone dạng C" });
  });

  it("holds a draft the AI got partly wrong for review, naming the bad fields, without retrying", async () => {
    const d = deps({ importSong: () => Promise.reject(new InvalidDraftError({ reason: "AI trả bản nháp chưa hợp lệ: artist: Too small", partial: { ...DRAFT, artist: "" } })) });
    const out = await runImport({ url: URL_, deps: d });
    expect(out).toMatchObject({ kind: "review", reason: expect.stringContaining("artist: Too small"), draft: { artist: "", sourceUrl: URL_ } });
    expect(d.published).toEqual([]);
    // The admin page reads the stored output back: an unfinished draft must survive that.
    expect(ImportOutcomeSchema.parse(JSON.parse(JSON.stringify(out)))).toEqual(out);
  });

  it("throws when the page cannot be fetched, so the queue retries", async () => {
    const d = deps({ fetchPage: () => Promise.reject(new Error("timeout")) });
    await expect(runImport({ url: URL_, deps: d })).rejects.toThrow("timeout");
  });
});
