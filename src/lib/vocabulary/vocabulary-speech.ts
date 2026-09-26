/**
 * Text-to-Speech (TTS) audio engine for Vocabulary mode.
 * Uses the browser's native Web Speech API (SpeechSynthesis) for zero-latency,
 * zero-bandwidth, offline-capable pronunciation and explanations.
 */

export interface SpeechOptions {
  rate?: number;
  pitch?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: unknown) => void;
}

export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && typeof window.speechSynthesis !== "undefined";
}

export function stopSpeaking(): void {
  if (!isSpeechSupported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // Graceful fallback for browser sandbox restrictions
  }
}

export function speakText(text: string, options: SpeechOptions = {}): void {
  if (!isSpeechSupported() || !text.trim()) return;

  try {
    stopSpeaking();
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    const utterance = new SpeechSynthesisUtterance(text.trim());
    utterance.lang = "en-US";
    utterance.rate = options.rate ?? 0.92; // Slightly deliberate for clear learner comprehension
    utterance.pitch = options.pitch ?? 1.0;

    if (options.onStart) utterance.onstart = options.onStart;
    if (options.onEnd) utterance.onend = options.onEnd;
    utterance.onerror = (e) => {
      options.onError?.(e);
      options.onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  } catch (err) {
    options.onError?.(err);
    options.onEnd?.();
  }
}

/**
 * Pronounces a single vocabulary word cleanly.
 */
export function speakWord(word: string, options: SpeechOptions = {}): void {
  speakText(word, { rate: 0.88, ...options });
}

/**
 * Pronounces the word and reads its definition and part of speech aloud.
 */
export function speakExplanation(word: string, definition: string, pos?: string, options: SpeechOptions = {}): void {
  const formatted = pos ? `${word}. ${definition}` : `${word}: ${definition}`;
  speakText(formatted, { rate: 0.95, ...options });
}
