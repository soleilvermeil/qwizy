"use client";

import { useState, useEffect, use, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, Card, CardContent } from "@/components/ui";
import { FlashCard, ProgressBar, SessionSummary, TeachCard } from "@/components/user";
import type { TtsPlayback } from "@/components/user/FlashCard";
import { previewAllRatings, type DBProgress } from "@/lib/fsrs";
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
    stability: number;
    difficulty: number;
    state: number;
    scheduledDays: number;
    reps: number;
    lapses: number;
    elapsedDays: number;
    learningSteps: number;
    dueDate: string;
    lastReviewed: string | null;
  } | null;
  showTts: TtsConfig | null;
  askTts: TtsConfig | null;
}

interface ExplanationItem {
  cardId: string;
  showFieldId: string;
  askFieldId: string;
  values: CardValue[];
  showTts: TtsConfig | null;
  askTts: TtsConfig | null;
}

type SessionItem =
  | { type: "question"; question: QuestionItem }
  | { type: "explanation"; explanation: ExplanationItem };

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
  explanations: number;
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
  const searchParams = useSearchParams();
  const initialExtra = searchParams.get("extra") === "true";
  const [deck, setDeck] = useState<Deck | null>(null);
  const [sessionItems, setSessionItems] = useState<SessionItem[]>([]);
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [hasMoreNewCards, setHasMoreNewCards] = useState(false);
  const [pendingDueCount, setPendingDueCount] = useState(0);
  const [reviewStats, setReviewStats] = useState<ReviewStats>({
    total: 0,
    easy: 0,
    good: 0,
    hard: 0,
    failed: 0,
  });

  const fetchSession = useCallback(async (mode: "normal" | "extra" | "dueOnly" = "normal") => {
    setIsLoading(true);
    try {
      const params = mode === "extra" ? "?extra=true" : mode === "dueOnly" ? "?dueOnly=true" : "";
      const url = `/api/learn/${deckId}${params}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch session");
      const data = await response.json();
      setDeck(data.deck);
      setSessionStats(data.stats);
      setHasMoreNewCards(data.hasMoreNewCards ?? false);

      // Build unified session list: due reviews -> explanations -> new questions
      const questions: QuestionItem[] = data.questions;
      const explanations: ExplanationItem[] = data.explanations ?? [];
      const dueCount = data.stats.due;

      const dueQuestions = questions.slice(0, dueCount);
      const newQuestions = questions.slice(dueCount);

      const items: SessionItem[] = [
        ...dueQuestions.map((q): SessionItem => ({ type: "question", question: q })),
        ...explanations.map((e): SessionItem => ({ type: "explanation", explanation: e })),
        ...newQuestions.map((q): SessionItem => ({ type: "question", question: q })),
      ];

      setSessionItems(items);
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
    fetchSession(initialExtra ? "extra" : "normal");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchSession]);

  // When a session completes, check how many due cards remain
  useEffect(() => {
    if (!isComplete) return;
    let cancelled = false;
    const checkPending = async () => {
      try {
        const response = await fetch(`/api/learn/${deckId}`);
        if (!response.ok || cancelled) return;
        const data = await response.json();
        setPendingDueCount(data.stats.due ?? 0);
        setHasMoreNewCards(data.hasMoreNewCards ?? false);
      } catch {
        // ignore
      }
    };
    checkPending();
    return () => { cancelled = true; };
  }, [isComplete, deckId]);

  const fetchExtra = useCallback(() => {
    fetchSession("extra");
  }, [fetchSession]);

  const fetchDueOnly = useCallback(() => {
    fetchSession("dueOnly");
  }, [fetchSession]);

  // Get the current session item
  const currentItem = sessionItems[currentIndex] ?? null;

  // Compute interval previews for each rating button (only for questions)
  const intervalPreviews = useMemo(() => {
    if (!currentItem || currentItem.type !== "question") return undefined;
    const progress = currentItem.question.progress;
    const dbProgress: DBProgress | null = progress
      ? {
          stability: progress.stability,
          difficulty: progress.difficulty,
          state: progress.state,
          reps: progress.reps,
          lapses: progress.lapses,
          scheduledDays: progress.scheduledDays,
          elapsedDays: progress.elapsedDays,
          learningSteps: progress.learningSteps,
          dueDate: new Date(progress.dueDate),
          lastReviewed: progress.lastReviewed ? new Date(progress.lastReviewed) : null,
        }
      : null;
    const raw = previewAllRatings(dbProgress);
    return {
      failed: "Again",
      hard: formatInterval(raw.hard),
      good: formatInterval(raw.good),
      easy: formatInterval(raw.easy),
    };
  }, [currentItem]);

  const handleRate = async (rating: "failed" | "hard" | "good" | "easy") => {
    if (!deck || !currentItem || currentItem.type !== "question") return;

    setIsSubmitting(true);
    const currentQuestion = currentItem.question;

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
            stability: data.progress.stability,
            difficulty: data.progress.difficulty,
            state: data.progress.state,
            scheduledDays: data.progress.scheduledDays,
            reps: data.progress.reps,
            lapses: data.progress.lapses ?? 0,
            elapsedDays: data.progress.elapsedDays ?? 0,
            learningSteps: data.progress.learningSteps ?? 0,
            dueDate: data.progress.dueDate,
            lastReviewed: data.progress.lastReviewed ?? null,
          },
        };
        setSessionItems((prev) => [...prev, { type: "question", question: retriedQuestion }]);
      }

      // Move to next item (or complete if no more items)
      if (currentIndex + 1 >= sessionItems.length && rating !== "failed") {
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

  const handleContinueExplanation = () => {
    if (currentIndex + 1 >= sessionItems.length) {
      setIsComplete(true);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

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

  if (isLoading || !deck) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // No items to study
  if (sessionItems.length === 0) {
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
                    ? "Your daily reviews are done. Want to learn extra cards?"
                    : "No cards to review right now. Come back later!"}
                </p>
                <div className="flex flex-col gap-2">
                  {hasMoreNewCards && (
                    <Button onClick={fetchExtra} fullWidth>
                      Learn More Cards
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
            onContinueReview={fetchDueOnly}
            pendingDueCount={pendingDueCount}
            onStudyMore={fetchExtra}
            hasMoreNewCards={hasMoreNewCards}
          />
        </div>
      </div>
    );
  }

  // Render the current item
  if (!currentItem) return null;

  const isExplanation = currentItem.type === "explanation";
  const itemData = isExplanation ? currentItem.explanation : currentItem.question;

  const showField = deck.fields.find((f) => f.id === itemData.showFieldId);
  const askField = deck.fields.find((f) => f.id === itemData.askFieldId);
  const frontValue =
    itemData.values.find((v) => v.fieldId === itemData.showFieldId)?.value || "";
  const backValue =
    itemData.values.find((v) => v.fieldId === itemData.askFieldId)?.value || "";
  const showTtsPlayback = resolveTts(itemData.showTts, itemData.values);
  const askTtsPlayback = resolveTts(itemData.askTts, itemData.values);

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
          total={sessionItems.length}
          label="Progress"
        />

        {/* Session stats */}
        {sessionStats && (
          <div className="flex justify-center gap-4 text-sm">
            {sessionStats.due > 0 && (
              <span className="text-warning">{sessionStats.due} review</span>
            )}
            {sessionStats.explanations > 0 && (
              <span className="text-success">{sessionStats.explanations} teach</span>
            )}
            {sessionStats.new > 0 && (
              <span className="text-primary">{sessionStats.new} new</span>
            )}
          </div>
        )}

        {/* Card -- TeachCard for explanations, FlashCard for questions */}
        {isExplanation ? (
          <TeachCard
            front={frontValue}
            back={backValue}
            frontLabel={showField?.name || "Front"}
            backLabel={askField?.name || "Back"}
            onContinue={handleContinueExplanation}
            showTts={showTtsPlayback}
            askTts={askTtsPlayback}
          />
        ) : (
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
        )}
      </div>
    </div>
  );
}
