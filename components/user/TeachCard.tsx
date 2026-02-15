"use client";

import { useEffect, useRef, useCallback } from "react";
import { Card, CardContent, Button } from "@/components/ui";
import type { TtsPlayback, HintValue } from "./FlashCard";
import { speak, cancelSpeech } from "@/lib/tts";

interface TeachCardProps {
  front: string;
  back: string;
  frontLabel: string;
  backLabel: string;
  onContinue: () => void;
  showTts?: TtsPlayback | null;
  askTts?: TtsPlayback | null;
  showHints?: HintValue[];
  askHints?: HintValue[];
}

export function TeachCard({
  front,
  back,
  frontLabel,
  backLabel,
  onContinue,
  showTts,
  askTts,
  showHints,
  askHints,
}: TeachCardProps) {
  const cardIdentityRef = useRef<string>("");

  // Auto-play TTS when the card changes
  useEffect(() => {
    const identity = `${front}|${back}`;
    if (identity === cardIdentityRef.current) return;
    cardIdentityRef.current = identity;

    if (showTts?.text) {
      speak(showTts);
    }
  }, [front, back, showTts]);

  // Cancel speech on unmount
  useEffect(() => {
    return () => cancelSpeech();
  }, []);

  const handleContinue = useCallback(() => {
    cancelSpeech();
    onContinue();
  }, [onContinue]);

  // Keyboard shortcut: Space to continue
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      if (e.code === "Space") {
        e.preventDefault();
        handleContinue();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleContinue]);

  return (
    <Card variant="elevated" padding="lg" className="max-w-lg mx-auto">
      <CardContent>
        <div className="space-y-6">

          {/* Show field */}
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

          {/* Ask field -- visible immediately, no blur */}
          <div className="text-center">
            <p className="text-xs uppercase tracking-wide text-muted mb-2">
              {backLabel}
            </p>
            <div className="flex items-center justify-center gap-2">
              {askTts?.text && (
                <span className="p-1.5 flex-shrink-0 invisible" aria-hidden="true">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" />
                </span>
              )}
              <p className="text-2xl sm:text-3xl font-medium text-primary">
                {back || <span className="text-muted italic">Empty</span>}
              </p>
              {askTts?.text && (
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

          {/* Continue button */}
          <div className="pt-4 border-t border-border">
            <Button onClick={handleContinue} variant="primary" size="lg" fullWidth>
              Continue{" "}
              <kbd className="ml-2 text-xs opacity-50 font-mono">Space</kbd>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
