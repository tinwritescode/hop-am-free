// Search and share metadata: canonical links, Open Graph / Twitter cards, the per-song share image's content, JSON-LD.
import type { Metadata } from "next";
import { statedFret } from "./capo";
import { chordsInOrder } from "./chordsheet";
import { voicingsFor, type Position } from "./chords";
import type { Song } from "./song";

export const SITE_NAME = "Hợp Âm Free";
export const HOME_TITLE = `${SITE_NAME} – hợp âm guitar, thế tay ngay bên cạnh`;
export const HOME_DESCRIPTION = "Tra hợp âm guitar miễn phí: lời và thế bấm trên cùng một màn hình, có Mầm dẫn bài, soát lỗi và gợi ý hợp âm dễ đánh.";
export const OG_SIZE = { width: 1200, height: 630 } as const;
/** The share image for pages without their own. */
export const SITE_OG_PATH = "/og/site";

/**
 * Title, description, canonical link and share cards for a public page. `path: null` marks a view that should stay
 * out of search results (a search, a narrow filter); it is still followed so its links get crawled.
 */
export function pageMeta({ title, description, path, image = SITE_OG_PATH }: { title: string; description: string; path: string | null; image?: string }): Metadata {
  return {
    title,
    description,
    ...(path === null ? { robots: { index: false, follow: true } } : { alternates: { canonical: path } }),
    ...shareCards({ title, description, url: path, image }),
  };
}

/** Open Graph and Twitter card fields; with only an image, the site-wide defaults the root layout sets. */
export function shareCards({ title, description, url = null, image }: { title?: string; description?: string; url?: string | null; image: string }): Pick<Metadata, "openGraph" | "twitter"> {
  return {
    openGraph: { type: "website", siteName: SITE_NAME, locale: "vi_VN", title, description, ...(url === null ? {} : { url }), images: [{ url: image, ...OG_SIZE, alt: title ?? SITE_NAME }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

type SongFacts = Pick<Song, "title" | "artist" | "key" | "rhythm" | "capo">;

export function songDescription(song: SongFacts): string {
  const fret = statedFret(song.capo);
  const capo = fret ? `, capo ${fret}` : "";
  const rhythm = song.rhythm ? `, điệu ${song.rhythm}` : "";
  return `Hợp âm guitar ${song.title} (${song.artist}), tone ${song.key}${capo}${rhythm}. Lời và thế bấm trên cùng một màn hình.`;
}

const CARD_CHORDS = 4;

/** What the per-song share image shows. Text is NFC so every Vietnamese letter is one glyph in the card font. */
export type SongCard = { title: string; artist: string; key: string; rhythm: string; capo: number | null; chords: { name: string; position: Position }[] };

export function songCard(song: SongFacts & Pick<Song, "sheet">): SongCard {
  const chords = chordsInOrder(song.sheet).flatMap((name) => {
    const [position] = voicingsFor({ name, easiestFirst: true });
    return position ? [{ name, position }] : [];
  });
  return {
    title: song.title.normalize("NFC"),
    artist: song.artist.normalize("NFC"),
    key: song.key,
    rhythm: song.rhythm.normalize("NFC"),
    capo: statedFret(song.capo),
    chords: chords.slice(0, CARD_CHORDS),
  };
}

/** A short hash of everything the card draws (FNV-1a), so the image URL changes exactly when the picture would. */
export function cardVersion(card: SongCard): string {
  let hash = 0x811c9dc5;
  for (const ch of JSON.stringify(card)) {
    hash ^= ch.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(36);
}

/** The share image URL; the version segment lets the image be cached forever (see app/og/bai-hat). */
export function songOgPath({ slug, card }: { slug: string; card: SongCard }): string {
  return `/og/bai-hat/${slug}/${cardVersion(card)}`;
}

export function breadcrumbJsonLd({ origin, trail }: { origin: string; trail: { name: string; path: string }[] }) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({ "@type": "ListItem", position: i + 1, name: t.name, item: new URL(t.path, origin).href })),
  };
}
