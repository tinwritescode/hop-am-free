import { useCallback, useEffect, useRef, useState } from "react";
import { CatalogSchema, SongDetailSchema, type Catalog, type SongDetail } from "@hopamfree/core/api";
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

/** Runs `load` whenever `key` changes or `retry` is called; a stale response never overwrites a newer one. */
function useRemote<T>({ key, load }: { key: string; load: () => Promise<T> }): [Remote<T>, () => void] {
  const [state, setState] = useState<Remote<T>>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);
  // `load` is rebuilt each render; `key` says when it asks for something else.
  const latestLoad = useRef(load);
  latestLoad.current = load;
  useEffect(() => {
    let live = true;
    setState({ kind: "loading" });
    latestLoad.current().then(
      (data) => live && setState({ kind: "ok", data }),
      (err: unknown) => live && setState({ kind: "error", message: err instanceof Error ? err.message : "Không tải được." }),
    );
    return () => {
      live = false;
    };
  }, [key, attempt]);
  return [state, useCallback(() => setAttempt((n) => n + 1), [])];
}

// One download per app session, shared by the song list and every singer's page; a failure is not cached.
let catalog: Promise<Catalog> | null = null;
function loadCatalog(): Promise<Catalog> {
  catalog ??= getJson({ path: "/api/catalog", schema: CatalogSchema }).catch((err: unknown) => {
    catalog = null;
    throw err;
  });
  return catalog;
}

export function useCatalog(): [Remote<Catalog>, () => void] {
  return useRemote({ key: "catalog", load: loadCatalog });
}

export function useSong(slug: string): [Remote<SongDetail>, () => void] {
  return useRemote({ key: slug, load: () => getJson({ path: `/api/songs/${encodeURIComponent(slug)}`, schema: SongDetailSchema }) });
}
