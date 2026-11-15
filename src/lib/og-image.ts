import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ReactElement } from "react";
import { ImageResponse } from "next/og";
import { OG_SIZE } from "./seo";

const FONT_DIR = join(process.cwd(), "assets", "og-fonts");

// Read once per server process; Satori draws text as paths, so the image size does not depend on the fonts.
let fonts: Promise<NonNullable<ConstructorParameters<typeof ImageResponse>[1]>["fonts"]> | null = null;
function loadFonts() {
  fonts ??= Promise.all([
    readFile(join(FONT_DIR, "BeVietnamPro-Medium.ttf")),
    readFile(join(FONT_DIR, "BeVietnamPro-Bold.ttf")),
    readFile(join(FONT_DIR, "YesevaOne-Regular.ttf")),
  ]).then(([medium, bold, display]) => [
    { name: "Body", data: medium, weight: 500, style: "normal" },
    { name: "Body", data: bold, weight: 700, style: "normal" },
    { name: "Display", data: display, weight: 400, style: "normal" },
  ]);
  return fonts;
}

/**
 * A PNG share image. `cache: "versioned"` is for URLs that carry a content version, which browsers and social
 * crawlers may keep for a year; `"daily"` is for a fixed URL whose picture may change with a deploy.
 */
export async function ogImage({ element, cache }: { element: ReactElement; cache: "versioned" | "daily" }): Promise<ImageResponse> {
  const control = cache === "versioned" ? "public, max-age=31536000, immutable" : "public, max-age=86400";
  return new ImageResponse(element, { ...OG_SIZE, fonts: await loadFonts(), headers: { "Cache-Control": control } });
}
