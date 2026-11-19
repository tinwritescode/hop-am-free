import { useEffect, useState } from "react";
import { SongDetailSchema, SongListResponseSchema, type SongDetail, type SongListItem } from "@hopamfree/core/api";
import type { z } from "zod";

const BASE_URL = "https://hopam.tyvn.online";

export type Remote<T> = { kind: "loading" } | { kind: "error"; message: string } | { kind: "ok"; data: T };

async function getJson<T>({ path, schema }: { path: string; schema: z.ZodType<T> }): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(res.status === 404 ? "Không tìm thấy" : `Lỗi máy chủ (${res.status})`);
  return schema.parse(await res.json());
}

/** Loads `path` whenever it changes; a stale response never overwrites a newer one. */
function useRemote<T>({ path, schema }: { path: string; schema: z.ZodType<T> }): Remote<T> {
  const [state, setState] = useState<Remote<T>>({ kind: "loading" });
  useEffect(() => {
    let live = true;
    setState({ kind: "loading" });
    getJson({ path, schema }).then(
      (data) => live && setState({ kind: "ok", data }),
      (err: unknown) => live && setState({ kind: "error", message: err instanceof Error ? err.message : "Không tải được" }),
    );
    return () => {
      live = false;
    };
  }, [path, schema]);
  return state;
}

export function useSongs(query: string): Remote<SongListItem[]> {
  const remote = useRemote({ path: `/api/songs?q=${encodeURIComponent(query)}`, schema: SongListResponseSchema });
  return remote.kind === "ok" ? { kind: "ok", data: remote.data.songs } : remote;
}

export function useSong(slug: string): Remote<SongDetail> {
  return useRemote({ path: `/api/songs/${encodeURIComponent(slug)}`, schema: SongDetailSchema });
}
