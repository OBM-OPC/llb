// Browser-native bg-BG TTS.
// Handles the well-known "empty voices on first call" problem: Chromium and
// Safari initially expose `speechSynthesis.getVoices()` as [], and only
// populate it later via the `voiceschanged` event. We cache once populated
// and re-trigger any pending utterance if a Bulgarian voice appears mid-speak.

export type SpeakOptions = { rate?: number; lang?: string; onEnd?: () => void };

let cachedVoices: SpeechSynthesisVoice[] | null = null;
let voicesReady = false;
let listenersInstalled = false;
let pending: { text: string; opts: SpeakOptions; voice: SpeechSynthesisVoice | null } | null = null;

function isSpeechAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

function refreshVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechAvailable()) return [];
  if (cachedVoices && voicesReady) return cachedVoices;
  cachedVoices = window.speechSynthesis.getVoices() ?? [];
  voicesReady = cachedVoices.length > 0;
  return cachedVoices;
}

function installVoicesListener() {
  if (!isSpeechAvailable() || listenersInstalled) return;
  listenersInstalled = true;
  const handler = () => {
    cachedVoices = window.speechSynthesis.getVoices() ?? [];
    voicesReady = cachedVoices.length > 0;
    if (voicesReady && pending) {
      const p = pending;
      pending = null;
      // Re-speak now that a Bulgarian voice is available. Drop any in-flight
      // call so we don't double-talk.
      try { window.speechSynthesis.cancel(); } catch { /* noop */ }
      speakBg(p.text, p.opts);
    }
  };
  window.speechSynthesis.addEventListener?.('voiceschanged', handler);
}

export function pickBulgarianVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;
  // 1. Exact Bulgarian locale.
  const exact = voices.find((v) => v.lang?.toLowerCase() === 'bg-bg');
  if (exact) return exact;
  // 2. Any bg-prefixed voice (covers bg-only locale codes some engines add).
  const prefix = voices.find((v) => v.lang?.toLowerCase().startsWith('bg'));
  if (prefix) return prefix;
  // 3. Anything defaulting to Bulgarian.
  const defaultBg = voices.find((v) => v.default && v.lang?.toLowerCase().startsWith('bg'));
  return defaultBg ?? null;
}

function speak(text: string, opts: SpeakOptions) {
  const u = new SpeechSynthesisUtterance(text);
  u.lang = opts.lang ?? 'bg-BG';
  u.rate = opts.rate ?? 0.86;
  if (opts.onEnd) {
    u.addEventListener?.('end', () => opts.onEnd?.());
    u.addEventListener?.('error', () => opts.onEnd?.());
  }
  window.speechSynthesis.speak(u);
}

/**
 * Speak `text` in Bulgarian. Tries a Bulgarian voice if one is available;
 * otherwise queues the utterance and re-speaks as soon as the engine loads
 * a bg-prefixed voice (avoids the first-call voice-drop bug in Chromium).
 */
export function speakBg(text: string, opts: SpeakOptions = {}): boolean {
  if (!isSpeechAvailable()) return false;
  installVoicesListener();
  const voices = refreshVoices();
  const bg = pickBulgarianVoice(voices);
  // Always cancel any pending utterance to keep rapid taps predictable.
  try { window.speechSynthesis.cancel(); } catch { /* noop */ }
  if (bg && voicesReady) {
    // Build utterance with voice attached.
    const u = new SpeechSynthesisUtterance(text);
    u.lang = opts.lang ?? 'bg-BG';
    u.rate = opts.rate ?? 0.86;
    u.voice = bg;
    if (opts.onEnd) {
      u.addEventListener?.('end', () => opts.onEnd?.());
      u.addEventListener?.('error', () => opts.onEnd?.());
    }
    pending = null;
    window.speechSynthesis.speak(u);
    return true;
  }
  // No Bulgarian voice yet — speak now with the system default and remember
  // to retry with the Bulgarian voice when voiceschanged fires.
  speak(text, opts);
  pending = { text, opts, voice: bg };
  return true;
}

// Backwards-compatible default export.
export function speakBulgarian(text: string) {
  return speakBg(text, { rate: 0.86 });
}

// Exposed for tests.
export function __resetTtsStateForTests() {
  cachedVoices = null;
  voicesReady = false;
  listenersInstalled = false;
  pending = null;
}
