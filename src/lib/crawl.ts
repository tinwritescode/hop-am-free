import { load } from "cheerio";
import { lookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";
import { lookupChord } from "./chords";

const MAX_TEXT = 20_000;
const MAX_BYTES = 3_000_000;
const BLOCKS = "address,article,aside,blockquote,dd,div,dl,dt,figcaption,figure,h1,h2,h3,h4,h5,h6,header,li,main,ol,p,pre,section,table,td,th,tr,ul";

export type PageText = { title: string; description: string; text: string };

/** Readable text of a page, one line per block element, so `[Am]`-style chords stay next to their words. */
export function extractPage(html: string): PageText {
  const $ = load(html);
  const title = $("title").first().text().trim();
  const description = ($('meta[property="og:description"]').attr("content") ?? $('meta[name="description"]').attr("content") ?? "").trim();
  $("script,style,noscript,svg,iframe,template,nav,form,button,select").remove();
  $("br").replaceWith("\n");
  $(BLOCKS).each((_, el) => {
    $(el).prepend("\n").append("\n");
  });
  const lines = $("body")
    .text()
    .split("\n")
    .map((l) => l.replace(/[\s ]+/g, " ").trim());
  const text = lines
    .filter((l, i) => l !== "" || (i > 0 && lines[i - 1] !== ""))
    .join("\n")
    .trim()
    .slice(0, MAX_TEXT);
  return { title, description, text };
}

const MIN_CHORD_LINES = 4;
const hasChord = (line: string) => [...line.matchAll(/\[([^\]\s]{1,12})\]/g)].some((m) => lookupChord(m[1]) !== null);

/**
 * The sheet as the page already writes it, `[Am]`-style chords inline: every line from the first line with a chord
 * to the last. Null when the page does not write chords that way. Lets an import skip asking the AI to copy lyrics.
 */
export function chordSheetRegion(text: string): string | null {
  const lines = text.split("\n");
  const chordLines = lines.flatMap((l, i) => (hasChord(l) ? [i] : []));
  const [first] = chordLines;
  const last = chordLines.at(-1);
  if (chordLines.length < MIN_CHORD_LINES || first === undefined || last === undefined) return null;
  const region = lines.slice(first, last + 1);
  const blanks = region.filter((l) => l === "").length;
  // A blank after nearly every line means each line was its own block, not stanza breaks (those are lost there anyway).
  return (blanks * 2 >= region.length - 1 ? region.filter((l) => l !== "") : region).join("\n").trim();
}

const blocked = new BlockList();
for (const [net, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.168.0.0", 16],
  ["224.0.0.0", 3],
] as const)
  blocked.addSubnet(net, prefix, "ipv4");
for (const [net, prefix] of [
  ["::", 127],
  ["fc00::", 7],
  ["fe80::", 10],
] as const)
  blocked.addSubnet(net, prefix, "ipv6");

export function isBlockedAddress(ip: string): boolean {
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(ip);
  if (mapped) return blocked.check(mapped[1], "ipv4");
  return blocked.check(ip, isIP(ip) === 6 ? "ipv6" : "ipv4");
}

async function assertPublicHost(url: URL): Promise<void> {
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Chỉ hỗ trợ link http/https");
  const addrs = await lookup(url.hostname, { all: true });
  if (addrs.length === 0 || addrs.some((a) => isBlockedAddress(a.address))) throw new Error("Link trỏ vào mạng nội bộ");
}

async function readCapped(res: Response): Promise<string> {
  if (!res.body) return "";
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BYTES) {
      await reader.cancel();
      break;
    }
    chunks.push(value);
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

/**
 * Fetches a public web page for import. Each redirect hop is re-checked against private networks.
 * shortcut: DNS is resolved before fetch, so a rebinding host could still swap addresses in between; acceptable while only admins can import.
 */
export async function fetchPage(raw: string): Promise<PageText> {
  let url = new URL(raw);
  for (let hop = 0; hop < 4; hop++) {
    await assertPublicHost(url);
    const res = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(15_000),
      headers: { "user-agent": "Mozilla/5.0 (compatible; HopAmFreeImporter/1.0)", accept: "text/html,application/xhtml+xml" },
    });
    const location = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && location) {
      url = new URL(location, url);
      continue;
    }
    if (!res.ok) throw new Error(`Trang trả về lỗi ${res.status}`);
    return extractPage(await readCapped(res));
  }
  throw new Error("Link chuyển hướng quá nhiều lần");
}
