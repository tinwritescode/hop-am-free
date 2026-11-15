import { z } from "zod";

/** How many playable songs the home page's "Chơi được ngay" card lists. */
export const PLAYABLE_PREVIEW = 6;

/** GET /api/songs/playable: what the "Chơi được ngay" card shows. */
export const PlayableResponseSchema = z.object({
  count: z.number().int().min(0),
  songs: z.array(z.object({ slug: z.string(), title: z.string(), artist: z.string() })).max(PLAYABLE_PREVIEW),
});
export type PlayableResponse = z.infer<typeof PlayableResponseSchema>;
