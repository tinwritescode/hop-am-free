// Makes Web Audio audible on phones.
//
// Phones block Web Audio in three ways:
// 1. The AudioContext starts "suspended" (or turns "interrupted" after a call or an app switch).
//    It only resumes when resume() is called inside a tap.
// 2. iPhone treats Web Audio as "ambient" sound, so the silent switch mutes it.
//    iOS 17+ lets a page opt into "playback" with navigator.audioSession.
//    Older iOS switches to "playback" while an <audio> element plays, so we play a silent one.
// 3. Old iOS only starts output once a buffer is started inside the tap.
//
// Call `unlockAudio()` synchronously at the start of every tap handler that makes sound.

let ctx: AudioContext | null = null;
let keepAlive: HTMLAudioElement | null = null;
let releaseTimer: ReturnType<typeof setTimeout> | null = null;
let holdUntil = 0;

export function audioContext(): AudioContext {
  return (ctx ??= new AudioContext({ latencyHint: "interactive" }));
}

/** iPhone, iPod, and iPad (iPadOS reports itself as a Mac with a touch screen). */
export function isAppleTouch({ userAgent, maxTouchPoints }: { userAgent: string; maxTouchPoints: number }): boolean {
  return /iP(hone|od|ad)/.test(userAgent) || (/Macintosh/.test(userAgent) && maxTouchPoints > 1);
}

/** A mono 16-bit PCM WAV file of silence. */
export function silentWav({ sampleRate, seconds }: { sampleRate: number; seconds: number }): Uint8Array<ArrayBuffer> {
  const samples = Math.max(1, Math.round(sampleRate * seconds));
  const dataBytes = samples * 2;
  const bytes = new Uint8Array(44 + dataBytes);
  const view = new DataView(bytes.buffer);
  const ascii = (offset: number, text: string) => [...text].forEach((ch, i) => view.setUint8(offset + i, ch.charCodeAt(0)));
  ascii(0, "RIFF");
  view.setUint32(4, 36 + dataBytes, true);
  ascii(8, "WAVE");
  ascii(12, "fmt ");
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  ascii(36, "data");
  view.setUint32(40, dataBytes, true);
  return bytes;
}

/** iOS 17+: ask for "playback" so the silent switch does not mute us. Returns false when the API is missing. */
function preferPlaybackSession(): boolean {
  const session: unknown = Reflect.get(navigator, "audioSession");
  if (typeof session !== "object" || session === null || !("type" in session)) return false;
  if (session.type !== "playback") Reflect.set(session, "type", "playback");
  return true;
}

function startKeepAlive() {
  if (!keepAlive) {
    const url = URL.createObjectURL(new Blob([silentWav({ sampleRate: 8000, seconds: 0.5 })], { type: "audio/wav" }));
    keepAlive = new Audio(url);
    keepAlive.loop = true;
    keepAlive.setAttribute("playsinline", "");
    keepAlive.setAttribute("x-webkit-airplay", "deny");
  }
  if (keepAlive.paused) void keepAlive.play().catch(() => undefined);
}

function stopKeepAlive() {
  keepAlive?.pause();
}

/**
 * Resumes audio from inside a tap and keeps it audible for `holdSeconds`.
 * The silent <audio> fallback is paused afterwards so it does not linger in the lock screen player.
 */
export function unlockAudio({ holdSeconds }: { holdSeconds: number }): AudioContext {
  const a = audioContext();
  const needsKeepAlive = !preferPlaybackSession() && isAppleTouch({ userAgent: navigator.userAgent, maxTouchPoints: navigator.maxTouchPoints });
  if (needsKeepAlive) {
    startKeepAlive();
    // A short sound must not cut off a longer one that is still playing.
    holdUntil = Math.max(holdUntil, Date.now() + holdSeconds * 1000);
    if (releaseTimer) clearTimeout(releaseTimer);
    releaseTimer = setTimeout(releaseAudio, holdUntil - Date.now());
  }
  if (a.state !== "running") void a.resume().catch(() => undefined);
  const tick = a.createBufferSource();
  tick.buffer = a.createBuffer(1, 1, a.sampleRate);
  tick.connect(a.destination);
  tick.start(0);
  return a;
}

/** Ends the hold early, for example when the visitor presses stop. */
export function releaseAudio(): void {
  if (releaseTimer) clearTimeout(releaseTimer);
  releaseTimer = null;
  holdUntil = 0;
  stopKeepAlive();
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) releaseAudio();
  });
}
