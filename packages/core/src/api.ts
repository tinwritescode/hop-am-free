// The public song API the web serves and the mobile app reads, so both sides agree on one shape.
import { z } from "zod";

export const SongListItemSchema = z.object({ slug: z.string(), title: z.string(), artist: z.string(), key: z.string() });
export const SongListResponseSchema = z.object({ songs: z.array(SongListItemSchema) });
export type SongListItem = z.infer<typeof SongListItemSchema>;
export type SongListResponse = z.infer<typeof SongListResponseSchema>;

/** `sheet` is the raw "[C] lyric" text; read it with parseChordSheet. */
export const SongDetailSchema = SongListItemSchema.extend({
  composer: z.string(),
  rhythm: z.string(),
  capo: z.int().nullable(),
  sheet: z.string(),
});
export type SongDetail = z.infer<typeof SongDetailSchema>;

/** Every song in one response, so the app searches by title or singer on the phone. */
export const CatalogSchema = z.object({
  songs: z.array(SongListItemSchema.extend({ artists: z.array(z.string()) })),
  /** Each singer with their song count, most songs first. */
  artists: z.array(z.object({ name: z.string(), count: z.int() })),
});
export type Catalog = z.infer<typeof CatalogSchema>;
