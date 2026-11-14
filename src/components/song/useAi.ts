"use client";

import { useCallback, useRef, useState } from "react";
import { AiResultSchema, type AiResult, type AiResultFor, type AiTask } from "@/lib/ai-schema";

export type AiState<T extends AiTask> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: AiResultFor<T> };

type AllStates = { [K in AiTask]: AiState<K> };
const IDLE = { status: "idle" } as const;

function isTask<T extends AiTask>(result: AiResult, task: T): result is AiResultFor<T> {
  return result.task === task;
}

export function useAi(slug: string) {
  const [states, setStates] = useState<AllStates>({ tour: IDLE, review: IDLE, easy: IDLE, rich: IDLE });
  const started = useRef(new Set<AiTask>());

  const request = useCallback(
    async <T extends AiTask>(task: T) => {
      if (started.current.has(task)) return;
      started.current.add(task);
      const set = (s: AiState<T>) => setStates((prev) => ({ ...prev, [task]: s }));
      set({ status: "loading" });
      try {
        const res = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug, task }),
        });
        const json: unknown = await res.json();
        const parsed = AiResultSchema.safeParse(json);
        if (!res.ok || !parsed.success || !isTask(parsed.data, task)) throw new Error("bad response");
        set({ status: "ready", data: parsed.data });
      } catch {
        started.current.delete(task);
        set({ status: "error", message: "Mầm đang bận, thử lại sau nhé." });
      }
    },
    [slug],
  );

  return { states, request };
}
