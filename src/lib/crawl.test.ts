import { describe, expect, it } from "vitest";
import { extractPage, isBlockedAddress } from "./crawl";

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

describe("isBlockedAddress", () => {
  it("blocks loopback, private, link-local and mapped-private addresses", () => {
    for (const ip of ["127.0.0.1", "10.1.2.3", "172.20.0.1", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "::1", "fd00::1", "fe80::1", "::ffff:10.0.0.1"])
      expect(isBlockedAddress(ip), ip).toBe(true);
  });

  it("allows public addresses", () => {
    for (const ip of ["104.21.3.4", "8.8.8.8", "2606:4700::1111"]) expect(isBlockedAddress(ip), ip).toBe(false);
  });
});
