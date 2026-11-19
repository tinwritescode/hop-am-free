import { useCallback, useEffect, useState } from "react";
import { SongDetailSchema, SongListResponseSchema, type SongDetail, type SongListItem } from "@hopamfree/core/api";
import type { z } from "zod";

// EXPO_PUBLIC_API_URL points a dev build at a local server (e.g. http://localhost:3000).
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://hopam.tyvn.online";

export type Remote<T> = { kind: "loading" } | { kind: "error"; message: string } | { kind: "ok"; data: T };

async function getJson<T>({ path, schema }: { path: string; schema: z.ZodType<T> }): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`).catch(() => {
    throw new Error("Không kết nối được. Kiểm tra mạng rồi thử lại.");
  });
  if (res.status === 404) throw new Error("Không tìm thấy bài này trên Hợp Âm Free.");
  if (!res.ok) throw new Error(`Máy chủ đang lỗi (${res.status}). Thử lại sau ít phút.`);
  return schema.parse(await res.json());
}

/** Loads `path` whenever it changes or `retry` is called; a stale response never overwrites a newer one. */
function useRemote<T>({ path, schema }: { path: string; schema: z.ZodType<T> }): [Remote<T>, () => void] {
  const [state, setState] = useState<Remote<T>>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    setState({ kind: "loading" });
    getJson({ path, schema }).then(
      (data) => live && setState({ kind: "ok", data }),
      (err: unknown) => live && setState({ kind: "error", message: err instanceof Error ? err.message : "Không tải được." }),
    );
    return () => {
      live = false;
    };
  }, [path, schema, attempt]);
  return [state, useCallback(() => setAttempt((n) => n + 1), [])];
}

export function useSongs(query: string): [Remote<SongListItem[]>, () => void] {
  const [remote, retry] = useRemote({ path: `/api/songs?q=${encodeURIComponent(query)}`, schema: SongListResponseSchema });
  return [remote.kind === "ok" ? { kind: "ok", data: remote.data.songs } : remote, retry];
}

export function useSong(slug: string): [Remote<SongDetail>, () => void] {
  return useRemote({ path: `/api/songs/${encodeURIComponent(slug)}`, schema: SongDetailSchema });
}
