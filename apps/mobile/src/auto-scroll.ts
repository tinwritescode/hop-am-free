import { useCallback, useEffect, useRef, useState } from "react";
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, ScrollViewInstance } from "react-native";

/** Points per second for speeds 1–5; a typical sheet runs ~1500pt over a 3–4 minute song. */
export const SPEEDS = [6, 10, 15, 22, 32] as const;

/**
 * Scrolls a ScrollView down slowly while playing. The position is kept as a float of its own, because
 * the offsets the view reports back are rounded and would stall the slowest speeds; a finger drag
 * moves it, and reaching the end stops playback.
 */
export function useAutoScroll() {
  const ref = useRef<ScrollViewInstance>(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const pos = useRef(0);
  const dragging = useRef(false);
  const viewport = useRef(0);
  const content = useRef(0);

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let last: number | null = null;
    const tick = (now: number) => {
      if (last !== null && !dragging.current) {
        const end = Math.max(0, content.current - viewport.current);
        pos.current = Math.min(end, pos.current + (SPEEDS[speed] * (now - last)) / 1000);
        ref.current?.scrollTo({ y: pos.current, animated: false });
        if (pos.current >= end) return setPlaying(false);
      }
      last = now;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, speed]);

  const sync = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    pos.current = e.nativeEvent.contentOffset.y;
  }, []);

  return {
    ref,
    playing,
    speed,
    toggle: useCallback(() => setPlaying((p) => !p), []),
    slower: useCallback(() => setSpeed((s) => Math.max(0, s - 1)), []),
    faster: useCallback(() => setSpeed((s) => Math.min(SPEEDS.length - 1, s + 1)), []),
    onScroll: useCallback(
      (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (dragging.current) sync(e);
      },
      [sync],
    ),
    scrollProps: {
      onScrollBeginDrag: useCallback(() => {
        dragging.current = true;
      }, []),
      onScrollEndDrag: useCallback(
        (e: NativeSyntheticEvent<NativeScrollEvent>) => {
          dragging.current = false;
          sync(e);
        },
        [sync],
      ),
      // A flick keeps gliding after the finger lifts; let it finish before playback takes over again.
      onMomentumScrollBegin: useCallback(() => {
        dragging.current = true;
      }, []),
      onMomentumScrollEnd: useCallback(
        (e: NativeSyntheticEvent<NativeScrollEvent>) => {
          dragging.current = false;
          sync(e);
        },
        [sync],
      ),
      onLayout: useCallback((e: LayoutChangeEvent) => {
        viewport.current = e.nativeEvent.layout.height;
      }, []),
      onContentSizeChange: useCallback((_w: number, h: number) => {
        content.current = h;
      }, []),
    },
  };
}
