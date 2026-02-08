"use client";

import { useState, useEffect, use, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, CardContent } from "@/components/ui";
import { FlashCard, ProgressBar, SessionSummary } from "@/components/user";
import type { TtsPlayback } from "@/components/user/FlashCard";
import { previewAllRatings } from "@/lib/sm2";
import { formatInterval } from "@/lib/mastery";

interface Field {
  id: string;
  name: string;
  position: number;
}

interface CardValue {
  id: string;
  fieldId: string;
  value: string;
}

interface TtsConfig {
  lang: string;
  fieldId: string;
  stopAt: string | null;
}

interface QuestionItem {
  cardId: string;
  showFieldId: string;
  askFieldId: string;
  values: CardValue[];
  progress: {
    easinessFactor: number;
    interval: number;
    repetitions: number;
    dueDate: string;
  } | null;
  showTts: TtsConfig | null;
  askTts: TtsConfig | null;
}

interface Deck {
  id: string;
  name: string;
  fields: Field[];
  fieldPairs: { showFieldId: string; askFieldId: string }[];
}

interface SessionStats {
  total: number;
  due: number;
  new: number;
  reviewCards: number;
  newCards: number;
}

interface ReviewStats {
  total: number;
  easy: number;
  good: number;
  hard: number;
  failed: number;
}

interface PageProps {
  params: Promise<{ deckId: string }>;
}

export default function LearnPage({ params }: PageProps) {
  const { deckId } = use(params);
  const router = useRouter();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [hasMoreNewCards, setHasMoreNewCards] = useState(false);
  const [reviewStats, setReviewStats] = useState<ReviewStats>({
    total: 0,
    easy: 0,
    good: 0,
    hard: 0,
    failed: 0,
  });

  const fetchSession = useCallback(async (extra = false) => {
    setIsLoading(true);
    try {
      const url = extra
        ? `/api/learn/${deckId}?extra=true`
        : `/api/learn/${deckId}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch session");
      const data = await response.json();
      setDeck(data.deck);
      setQuestions(data.questions);
      setSessionStats(data.stats);
      setHasMoreNewCards(data.hasMoreNewCards ?? false);
      setCurrentIndex(0);
      setIsComplete(false);
      setReviewStats({ total: 0, easy: 0, good: 0, hard: 0, failed: 0 });
    } catch (error) {
      console.error("Error fetching session:", error);
      router.push("/decks");
    } finally {
      setIsLoading(false);
    }
  }, [deckId, router]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const fetchExtra = useCallback(() => {
    fetchSession(true);
  }, [fetchSession]);

  // Compute interval previews for each rating button
  const intervalPreviews = useMemo(() => {
    const question = questions[currentIndex];
    if (!question) return undefined;
    const progress = question.progress;
    const ef = progress?.easinessFactor ?? 2.5;
    const interval = progress?.interval ?? 0;
    const reps = progress?.repetitions ?? 0;
    const raw = previewAllRatings(ef, interval, reps);
    return {
      failed: "Again",
      hard: formatInterval(raw.hard),
      good: formatInterval(raw.good),
      easy: formatInterval(raw.easy),
    };
  }, [questions, currentIndex]);

  const handleRate = async (rating: "failed" | "hard" | "good" | "easy") => {
    if (!deck || currentIndex >= questions.length) return;

    setIsSubmitting(true);
    const currentQuestion = questions[currentIndex];

    try {
      const response = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId: currentQuestion.cardId,
          showFieldId: currentQuestion.showFieldId,
          askFieldId: currentQuestion.askFieldId,
          rating,
        }),
      });

      if (!response.ok) throw new Error("Failed to update progress");

      const data = await response.json();

      // Update review stats
      setReviewStats((prev) => ({
        ...prev,
        total: prev.total + 1,
        [rating]: prev[rating] + 1,
      }));

      if (rating === "failed") {
        // Re-queue the failed question at the end of the session
        // with updated progress so interval previews are correct on retry
        const retriedQuestion: QuestionItem = {
          ...currentQuestion,
          progress: {
            easinessFactor: data.progress.easinessFactor,
            interval: data.progress.interval,
            repetitions: data.progress.repetitions,
            dueDate: data.progress.dueDate,
          },
        };
        setQuestions((prev) => [...prev, retriedQuestion]);
      }

      // Move to next question (or complete if no more questions)
      if (currentIndex + 1 >= questions.length && rating !== "failed") {
        // Only complete if we didn't just add a retry question
        setIsComplete(true);
      } else {
        setCurrentIndex(currentIndex + 1);
      }
    } catch (error) {
      console.error("Error updating progress:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !deck) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // No questions to study
  if (questions.length === 0) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-lg mx-auto px-4 space-y-6">
          <Link href="/decks">
            <Button variant="ghost" size="sm">
              <svg
                className="w-5 h-5 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Decks
            </Button>
          </Link>

          <Card variant="elevated" padding="lg">
            <CardContent>
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 mb-4">
                  <svg
                    className="w-8 h-8 text-success"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  All caught up!
                </h2>
                <p className="text-muted mb-4">
                  {hasMoreNewCards
                    ? "Your daily reviews are done. Want to study extra cards?"
                    : "No cards to review right now. Come back later!"}
                </p>
                <div className="flex flex-col gap-2">
                  {hasMoreNewCards && (
                    <Button onClick={fetchExtra} fullWidth>
                      Study More Cards
                    </Button>
                  )}
                  <Link href="/decks">
                    <Button variant={hasMoreNewCards ? "secondary" : "primary"} fullWidth>
                      Back to Decks
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Session complete
  if (isComplete) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-lg mx-auto px-4">
          <SessionSummary
            deckName={deck.name}
            stats={reviewStats}
            onStudyMore={fetchExtra}
            hasMoreNewCards={hasMoreNewCards}
          />
        </div>
      </div>
    );
  }

  // Get current question values
  const currentQuestion = questions[currentIndex];
  const showField = deck.fields.find((f) => f.id === currentQuestion.showFieldId);
  const askField = deck.fields.find((f) => f.id === currentQuestion.askFieldId);
  const frontValue =
    currentQuestion.values.find((v) => v.fieldId === currentQuestion.showFieldId)?.value || "";
  const backValue =
    currentQuestion.values.find((v) => v.fieldId === currentQuestion.askFieldId)?.value || "";

  // Resolve TTS config into playback data
  function resolveTts(
    ttsConfig: TtsConfig | null,
    values: CardValue[]
  ): TtsPlayback | null {
    if (!ttsConfig) return null;
    const rawText = values.find((v) => v.fieldId === ttsConfig.fieldId)?.value || "";
    if (!rawText) return null;
    let text = rawText;
    if (ttsConfig.stopAt) {
      const idx = text.indexOf(ttsConfig.stopAt);
      if (idx !== -1) {
        text = text.substring(0, idx).trim();
      }
    }
    return { lang: ttsConfig.lang, text };
  }

  const showTtsPlayback = resolveTts(currentQuestion.showTts, currentQuestion.values);
  const askTtsPlayback = resolveTts(currentQuestion.askTts, currentQuestion.values);

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-lg mx-auto px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/decks">
            <Button variant="ghost" size="sm">
              <svg
                className="w-5 h-5 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Exit
            </Button>
          </Link>
          <h1 className="text-lg font-semibold text-foreground">{deck.name}</h1>
          <div className="w-16" /> {/* Spacer */}
        </div>

        {/* Progress */}
        <ProgressBar
          current={currentIndex}
          total={questions.length}
          label="Progress"
        />

        {/* Session stats */}
        {sessionStats && (
          <div className="flex justify-center gap-4 text-sm">
            {sessionStats.due > 0 && (
              <span className="text-warning">{sessionStats.due} review</span>
            )}
            {sessionStats.new > 0 && (
              <span className="text-primary">{sessionStats.new} new</span>
            )}
          </div>
        )}

        {/* Flashcard */}
        <FlashCard
          front={frontValue}
          back={backValue}
          frontLabel={showField?.name || "Front"}
          backLabel={askField?.name || "Back"}
          onRate={handleRate}
          isLoading={isSubmitting}
          intervalPreviews={intervalPreviews}
          showTts={showTtsPlayback}
          askTts={askTtsPlayback}
        />
      </div>
    </div>
  );
}
