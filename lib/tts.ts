import type { TtsPlayback } from "@/components/user/FlashCard";

const TTS_ENGINE_KEY = "tts-engine";

type TtsEngine = "browser" | "piper";

let currentAudio: HTMLAudioElement | null = null;
let currentObjectUrl: string | null = null;
let generationCounter = 0;

export function getTtsEngine(): TtsEngine {
  if (typeof window === "undefined") return "browser";
  const stored = localStorage.getItem(TTS_ENGINE_KEY);
  // Gracefully migrate legacy "kokoro" preference to "browser"
  if (stored === "kokoro") return "browser";
  return (stored as TtsEngine) || "browser";
}

export function setTtsEngine(engine: TtsEngine) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TTS_ENGINE_KEY, engine);
}

function speakBrowser(tts: TtsPlayback) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(tts.text);
  utterance.lang = tts.lang;
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

function cancelBrowser() {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

function stopPiperPlayback() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
  }
}

async function speakPiper(tts: TtsPlayback, genId: number) {
  const { piperSpeak, isPiperSupported } = await import("@/lib/tts-piper");

  if (!isPiperSupported(tts.lang)) {
    speakBrowser(tts);
    return;
  }

  try {
    const wav = await piperSpeak(tts.text, tts.lang);

    // Check if this generation is still current
    if (genId !== generationCounter) return;

    stopPiperPlayback();

    const url = URL.createObjectURL(wav);
    const audio = new Audio(url);

    currentAudio = audio;
    currentObjectUrl = url;

    audio.onended = () => {
      if (currentAudio === audio) {
        stopPiperPlayback();
      }
    };

    await audio.play();
  } catch (err) {
    console.warn("Piper TTS failed, falling back to browser:", err);
    if (genId === generationCounter) {
      speakBrowser(tts);
    }
  }
}

export function speak(tts: TtsPlayback) {
  if (typeof window === "undefined") return;

  cancelSpeech();
  const genId = ++generationCounter;

  const engine = getTtsEngine();
  if (engine === "piper") {
    speakPiper(tts, genId);
  } else {
    speakBrowser(tts);
  }
}

export function cancelSpeech() {
  generationCounter++;
  cancelBrowser();
  stopPiperPlayback();
}
