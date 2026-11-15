import { describe, expect, it } from "vitest";
import { countStatuses, jobStatus, parseUrlList, progress } from "./jobs";

describe("parseUrlList", () => {
  it("keeps http(s) links once, in order, skipping blanks and # comments", () => {
    const text = ["  https://a.vn/bai-1  ", "", "# xong rồi", "http://b.vn/x", "https://a.vn/bai-1", "\thttps://c.vn/y\r"].join("\n");
    expect(parseUrlList(text)).toEqual({ urls: ["https://a.vn/bai-1", "http://b.vn/x", "https://c.vn/y"], invalid: [] });
  });

  it("reports lines that are not http(s) links instead of queueing them", () => {
    expect(parseUrlList("ftp://a.vn/x\nkhông phải link\nhttps://ok.vn/1")).toEqual({ urls: ["https://ok.vn/1"], invalid: ["ftp://a.vn/x", "không phải link"] });
  });
});

describe("progress", () => {
  it("counts every state and calls finished jobs done", () => {
    expect(progress(["completed", "failed", "active", "created", "retry", "cancelled", "completed"])).toEqual({
      total: 7,
      done: 4,
      counts: { created: 1, retry: 1, active: 1, completed: 2, cancelled: 1, failed: 1 },
    });
  });

  it("is zero for an empty batch", () => {
    expect(progress([])).toEqual({ total: 0, done: 0, counts: { created: 0, retry: 0, active: 0, completed: 0, cancelled: 0, failed: 0 } });
  });
});

describe("jobStatus", () => {
  it("names a finished import by what happened to the song", () => {
    expect(jobStatus({ state: "completed", outcome: "published" })).toBe("published");
    expect(jobStatus({ state: "completed", outcome: "duplicate" })).toBe("duplicate");
    expect(jobStatus({ state: "completed", outcome: "review" })).toBe("review");
  });

  it("calls any other finished job done, and keeps queue states otherwise", () => {
    expect(jobStatus({ state: "completed", outcome: null })).toBe("done");
    expect(jobStatus({ state: "created", outcome: null })).toBe("waiting");
    expect(jobStatus({ state: "retry", outcome: null })).toBe("retrying");
    expect(jobStatus({ state: "active", outcome: null })).toBe("running");
    expect(jobStatus({ state: "failed", outcome: null })).toBe("failed");
    expect(jobStatus({ state: "cancelled", outcome: null })).toBe("cancelled");
  });
});

describe("countStatuses", () => {
  it("counts each status, zero for the absent ones", () => {
    expect(countStatuses(["published", "review", "published"])).toMatchObject({ published: 2, review: 1, failed: 0, waiting: 0 });
  });
});
