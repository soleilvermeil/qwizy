"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, Button } from "@/components/ui";
import { speak, cancelSpeech } from "@/lib/tts";

interface IntervalPreviews {
  failed: string;
  hard: string;
  good: string;
  easy: string;
}

export interface TtsPlayback {
  lang: string;
  text: string;
}

export interface HintValue {
  label: string;
  value: string;
}

interface FlashCardProps {
  front: string;
  back: string;
  frontLabel: string;
  backLabel: string;
  onRate: (rating: "failed" | "hard" | "good" | "easy") => void;
  isLoading?: boolean;
  intervalPreviews?: IntervalPreviews;
  showTts?: TtsPlayback | null;
  askTts?: TtsPlayback | null;
  showHints?: HintValue[];
  askHints?: HintValue[];
}

export function FlashCard({
  front,
  back,
  frontLabel,
  backLabel,
  onRate,
  isLoading = false,
  intervalPreviews,
  showTts,
  askTts,
  showHints,
  askHints,
}: FlashCardProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  // Track the card identity so we can detect card changes
  const cardIdentityRef = useRef<string>("");

  // Speak the show-side TTS when the card changes
  useEffect(() => {
    const identity = `${front}|${back}`;
    if (identity === cardIdentityRef.current) return;
    cardIdentityRef.current = identity;
    setIsRevealed(false);

    if (showTts?.text) {
      speak(showTts);
    }
    // NOTE: no cleanup here — speak() already cancels prior speech,
    // and a cleanup would kill the audio in React strict mode.
  }, [front, back, showTts]);

  // Cancel speech on unmount only
  useEffect(() => {
    return () => cancelSpeech();
  }, []);

  // Speak the ask-side TTS when the answer is revealed
  const handleReveal = useCallback(() => {
    setIsRevealed(true);
    if (askTts?.text) {
      speak(askTts);
    }
  }, [askTts]);

  const handleRate = useCallback(
    (rating: "failed" | "hard" | "good" | "easy") => {
      cancelSpeech();
      onRate(rating);
      setIsRevealed(false);
    },
    [onRate],
  );

  // Keyboard shortcuts: Space to reveal, 0-3 to rate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      if (e.code === "Space") {
        e.preventDefault();
        if (!isRevealed) handleReveal();
      }

      if (isRevealed && !isLoading) {
        const ratingMap: Record<
          string,
          "failed" | "hard" | "good" | "easy"
        > = {
          Digit0: "failed",
          Digit1: "hard",
          Digit2: "good",
          Digit3: "easy",
          Numpad0: "failed",
          Numpad1: "hard",
          Numpad2: "good",
          Numpad3: "easy",
        };
        const rating = ratingMap[e.code];
        if (rating) handleRate(rating);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isRevealed, isLoading, handleReveal, handleRate]);

  return (
    <Card variant="elevated" padding="lg" className="max-w-lg mx-auto">
      <CardContent>
        <div className="space-y-6">
          {/* Front of card */}
          <div className="text-center">
            <p className="text-xs uppercase tracking-wide text-muted mb-2">
              {frontLabel}
            </p>
            <div className="flex items-center justify-center gap-2">
              {showTts?.text && (
                <span className="p-1.5 flex-shrink-0 invisible" aria-hidden="true">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" />
                </span>
              )}
              <p className="text-2xl sm:text-3xl font-medium text-foreground">
                {front || <span className="text-muted italic">Empty</span>}
              </p>
              {showTts?.text && (
                <button
                  onClick={() => speak(showTts)}
                  className="p-1.5 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors flex-shrink-0"
                  aria-label="Play pronunciation"
                  title="Play pronunciation"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                </button>
              )}
            </div>
            {showHints && showHints.length > 0 && (
              <div className="mt-2 space-y-0.5">
                {showHints.map((hint, i) => (
                  <p key={i} className="text-sm text-muted">
                    {hint.label}: {hint.value}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Back of card (blurred then revealed) */}
          <div className="text-center min-h-[80px]">
            <p className="text-xs uppercase tracking-wide text-muted mb-2">
              {backLabel}
            </p>
            <div
              className={`${
                isRevealed
                  ? "transition-all duration-300"
                  : "blur-md select-none"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                {isRevealed && askTts?.text && (
                  <span className="p-1.5 flex-shrink-0 invisible" aria-hidden="true">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" />
                  </span>
                )}
                <p className={`text-2xl sm:text-3xl font-medium ${isRevealed ? "text-primary" : "text-foreground"}`}>
                  {back || <span className="text-muted italic">Empty</span>}
                </p>
                {isRevealed && askTts?.text && (
                  <button
                    onClick={() => speak(askTts)}
                    className="p-1.5 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors flex-shrink-0"
                    aria-label="Play pronunciation"
                    title="Play pronunciation"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                  </button>
                )}
              </div>
              {askHints && askHints.length > 0 && (
                <div className="mt-2 space-y-0.5">
                  {askHints.map((hint, i) => (
                    <p key={i} className="text-sm text-muted">
                      {hint.label}: {hint.value}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Rating section */}
          <div className="space-y-3 pt-4 border-t border-border">
            <p className="text-sm text-center text-muted">
              How well did you remember?
            </p>
            {isRevealed ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 animate-fade-in">
                <Button
                  variant="error"
                  onClick={() => handleRate("failed")}
                  disabled={isLoading}
                  className="flex-col py-3"
                >
                  <span className="text-lg">
                    Failed{" "}
                    <kbd className="text-xs opacity-50 font-mono">0</kbd>
                  </span>
                  <span className="text-xs opacity-75">
                    {intervalPreviews?.failed ?? "Again"}
                  </span>
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleRate("hard")}
                  disabled={isLoading}
                  className="flex-col py-3"
                >
                  <span className="text-lg">
                    Hard{" "}
                    <kbd className="text-xs opacity-50 font-mono">1</kbd>
                  </span>
                  <span className="text-xs opacity-75">
                    {intervalPreviews?.hard ?? "Soon"}
                  </span>
                </Button>
                <Button
                  variant="warning"
                  onClick={() => handleRate("good")}
                  disabled={isLoading}
                  className="flex-col py-3"
                >
                  <span className="text-lg">
                    Good{" "}
                    <kbd className="text-xs opacity-50 font-mono">2</kbd>
                  </span>
                  <span className="text-xs opacity-75">
                    {intervalPreviews?.good ?? "Normal"}
                  </span>
                </Button>
                <Button
                  variant="success"
                  onClick={() => handleRate("easy")}
                  disabled={isLoading}
                  className="flex-col py-3"
                >
                  <span className="text-lg">
                    Easy{" "}
                    <kbd className="text-xs opacity-50 font-mono">3</kbd>
                  </span>
                  <span className="text-xs opacity-75">
                    {intervalPreviews?.easy ?? "Later"}
                  </span>
                </Button>
              </div>
            ) : (
              <Button onClick={handleReveal} variant="secondary" size="lg" fullWidth>
                Show Answer{" "}
                <kbd className="ml-2 text-xs opacity-50 font-mono">Space</kbd>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
