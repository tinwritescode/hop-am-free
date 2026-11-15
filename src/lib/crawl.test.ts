import { describe, expect, it } from "vitest";
import { chordSheetRegion, extractPage, isBlockedAddress } from "./crawl";

const html = `<!doctype html><html><head><title>Hợp âm Nó - Thắng</title>
<meta property="og:description" content="Nó như thế [Am]này">
<style>.x{color:red}</style><script>var secret = 1;</script></head>
<body><nav>Trang chủ <a href="/">Playlist</a></nav>
<h1>Nó</h1><div class="info">Sáng tác: Võ Trung Thuận<br>Điệu: Ballad</div>
<div id="song-lyric"><div class="pre">
<div class="chord_lyric_line"><span>Nó như thế </span><span><i>[</i><span>Am</span><i>]</i></span><span>này sáng nào</span></div>
<div class="chord_lyric_line"><span>chúng ta đi </span><span><i>[</i><span>F</span><i>]</i></span><span>làm</span></div>
</div></div><noscript>bật JS</noscript></body></html>`;

describe("extractPage", () => {
  const page = extractPage(html);

  it("keeps title, description and one text line per block, with inline chords intact", () => {
    expect(page.title).toBe("Hợp âm Nó - Thắng");
    expect(page.description).toBe("Nó như thế [Am]này");
    expect(page.text.split("\n")).toEqual(expect.arrayContaining(["Nó như thế [Am]này sáng nào", "chúng ta đi [F]làm", "Sáng tác: Võ Trung Thuận", "Điệu: Ballad"]));
  });

  it("drops scripts, styles and noscript", () => {
    expect(page.text).not.toContain("secret");
    expect(page.text).not.toContain("color:red");
    expect(page.text).not.toContain("bật JS");
  });

  it("has no blank-line runs", () => {
    expect(page.text).not.toMatch(/\n\s*\n\s*\n/);
  });
});

describe("chordSheetRegion", () => {
  const text = [
    "Đăng nhập",
    "Tình bạn diệu kỳ",
    "Capo 2",
    "Amee",
    "Ta đã [G]hứa bên nhau, những năm [D]tháng nhọc nhằn",
    "You make [F#]me feel like, I got [Bm]everything.",
    "Ricky Star",
    "[G] Trôi đi trôi đi",
    "[D] nuôi ta khôn lên",
    "[G] [D] [F#] [Bm]",
    "Danh sách hợp âm",
    "Bài liên quan",
  ].join("\n");

  it("keeps the lines from the first chord line to the last, labels between them included", () => {
    expect(chordSheetRegion(text)).toBe(
      ["Ta đã [G]hứa bên nhau, những năm [D]tháng nhọc nhằn", "You make [F#]me feel like, I got [Bm]everything.", "Ricky Star", "[G] Trôi đi trôi đi", "[D] nuôi ta khôn lên", "[G] [D] [F#] [Bm]"].join("\n"),
    );
  });

  it("undoes double spacing from pages that put every line in its own block", () => {
    const spaced = ["Menu", "", "[G]Một", "", "[D]Hai", "", "Ricky Star", "", "[Em]Ba", "", "[C]Bốn", "", "Bài liên quan"].join("\n");
    expect(chordSheetRegion(spaced)).toBe(["[G]Một", "[D]Hai", "Ricky Star", "[Em]Ba", "[C]Bốn"].join("\n"));
  });

  it("keeps stanza breaks on pages that only leave blank lines between stanzas", () => {
    const stanzas = ["[G]Một", "[D]Hai", "", "[Em]Ba", "[C]Bốn"].join("\n");
    expect(chordSheetRegion(stanzas)).toBe(stanzas);
  });

  it("is null when the page has too few [chord] lines to be a sheet", () => {
    expect(chordSheetRegion("Hợp âm [Am] là gì?\nMenu\n[C] trưởng")).toBeNull();
  });

  it("ignores bracketed words that are not chords", () => {
    expect(chordSheetRegion("[Verse]\n[Chorus]\n[Intro]\n[Outro]\n[Bridge]")).toBeNull();
  });
});

describe("isBlockedAddress", () => {
  it("blocks loopback, private, link-local and mapped-private addresses", () => {
    for (const ip of ["127.0.0.1", "10.1.2.3", "172.20.0.1", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "::1", "fd00::1", "fe80::1", "::ffff:10.0.0.1"])
      expect(isBlockedAddress(ip), ip).toBe(true);
  });

  it("allows public addresses", () => {
    for (const ip of ["104.21.3.4", "8.8.8.8", "2606:4700::1111"]) expect(isBlockedAddress(ip), ip).toBe(false);
  });
});
