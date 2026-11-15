// Listening to the microphone in the browser. Sound never leaves the page.
import { detectPitch } from "./voice";

/**
 * Reads the pitch of the microphone every `everyMs` (Hz, or null for silence and noise) until the returned stop
 * function is called. Rejects when the visitor refuses the microphone.
 */
export async function listenPitch({ everyMs, onPitch }: { everyMs: number; onPitch: (hz: number | null) => void }): Promise<() => void> {
  // Raw sound: the browser's voice clean-up bends the pitch.
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
  const ctx = new AudioContext();
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;
  ctx.createMediaStreamSource(stream).connect(analyser);
  const slice = new Float32Array(analyser.fftSize);
  const timer = setInterval(() => {
    analyser.getFloatTimeDomainData(slice);
    onPitch(detectPitch({ samples: slice, sampleRate: ctx.sampleRate }));
  }, everyMs);
  return () => {
    clearInterval(timer);
    for (const t of stream.getTracks()) t.stop();
    void ctx.close();
  };
}
