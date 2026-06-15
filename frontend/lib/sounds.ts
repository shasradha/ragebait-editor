import { ErrorItem } from "./api";

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    // Standard AudioContext or WebkitAudioContext for Safari
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  // Resume if suspended (browser security policies)
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Play a synthesized sound using the Web Audio API.
 * @param freq Frequency in Hz
 * @param type Oscillator type ('sine', 'square', 'sawtooth', 'triangle')
 * @param duration Duration in seconds
 * @param volume Volume level between 0 and 1
 * @param delay Delay before starting the tone in seconds
 */
function playTone(
  freq: number,
  type: OscillatorType,
  duration: number,
  volume: number,
  delay: number = 0
) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, now + delay);

  // Volume envelope to prevent popping/clicking and give a nice fade-out
  gainNode.gain.setValueAtTime(0, now + delay);
  gainNode.gain.linearRampToValueAtTime(volume, now + delay + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + delay + duration);

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.start(now + delay);
  osc.stop(now + delay + duration);
}

/**
 * Play custom Hinglish / Gen-Z vibe audio cues based on analysis errors.
 */
export function playErrorSounds(errors: ErrorItem[]) {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (errors.length === 0) {
    // "W code no cap" - play a sweet, premium ascending success double-chime (Major pentatonic vibe)
    // Note 1: E5 (659.25 Hz)
    playTone(659.25, "sine", 0.15, 0.15, 0);
    // Note 2: A5 (880.00 Hz) a fraction of a second later
    playTone(880.00, "sine", 0.35, 0.15, 0.08);
  } else {
    // Code is cooked - play roasted sounds!
    // Check if there is any syntax/indent error (most critical/basic)
    const hasSyntaxOrIndent = errors.some(
      (err) => err.type === "syntax" || err.type === "indent"
    );

    if (hasSyntaxOrIndent) {
      // Comical sad trombone/buzzer sound: descending, detuned sawtooth/triangle wave
      // Note 1: slightly harsh low warning
      playTone(220, "triangle", 0.25, 0.2, 0);
      playTone(218, "sawtooth", 0.25, 0.05, 0); // detuned layer for a rougher buzz

      // Note 2: lower sad note
      playTone(165, "triangle", 0.45, 0.2, 0.2);
      playTone(163, "sawtooth", 0.45, 0.05, 0.2);
    } else {
      // Logic/formatting errors only: minor alert / warning beep pattern
      // A quick double warning beep (e.g. C#5)
      playTone(554.37, "sine", 0.08, 0.15, 0);
      playTone(554.37, "sine", 0.08, 0.15, 0.12);
    }
  }
}
