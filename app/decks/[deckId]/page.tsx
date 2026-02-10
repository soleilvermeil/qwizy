"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Modal, ModalFooter } from "@/components/ui";
import { DeckStats } from "@/components/user";
import { type MasteryLevel } from "@/lib/mastery";

interface Field {
  id: string;
  name: string;
  position: number;
}

interface DeckData {
  id: string;
  name: string;
  description: string | null;
  fields: Field[];
}

interface Stats {
  total: number;
  learned: number;
  dueToday: number;
  dueReviews: number;
  dueLearning: number;
  newAvailable: number;
  hasMoreNewCards: boolean;
  byMastery: Record<MasteryLevel, number>;
  upcoming: { newCards: number; low: number; medium: number; high: number }[];
  averageDifficulty: number;
  totalReviews: number;
}

export default function DeckStatsPage() {
  const params = useParams();
  const router = useRouter();
  const deckId = params.deckId as string;

  const [deck, setDeck] = useState<DeckData | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`/api/user/decks/${deckId}/stats`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError("Deck not found");
          return;
        }
        throw new Error("Failed to fetch stats");
      }

      const data = await response.json();
      setDeck(data.deck);
      setStats(data.stats);
    } catch (err) {
      console.error("Error fetching stats:", err);
      setError("Failed to load deck statistics");
    } finally {
      setIsLoading(false);
    }
  }, [deckId]);

  const handleResetProgress = async () => {
    setIsResetting(true);
    try {
      const response = await fetch(`/api/user/decks/${deckId}/progress`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to reset progress");
      }

      setShowResetModal(false);
      // Re-fetch stats to reflect the reset
      setIsLoading(true);
      await fetchStats();
    } catch (err) {
      console.error("Error resetting progress:", err);
      setError("Failed to reset progress");
    } finally {
      setIsResetting(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !deck || !stats) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <div className="text-center py-12">
          <p className="text-error">{error || "Unable to load deck"}</p>
          <Button variant="outline" onClick={() => router.push("/decks")} className="mt-4">
            Go to Decks
          </Button>
        </div>
      </div>
    );
  }

  // Determine button state
  const hasNormalSession = stats.dueReviews > 0 || stats.newAvailable > 0;
  const hasLearningOnly = !hasNormalSession && stats.dueLearning > 0;
  const hasExtraOnly = !hasNormalSession && !hasLearningOnly && stats.hasMoreNewCards;
  const hasAnything = hasNormalSession || hasLearningOnly || hasExtraOnly;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Decks
          </button>
          <h1 className="text-2xl font-bold text-foreground">{deck.name}</h1>
          {deck.description && (
            <p className="text-muted-foreground mt-1">{deck.description}</p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {hasAnything ? (
          <Link href={hasExtraOnly ? `/learn/${deckId}?extra=true` : `/learn/${deckId}`} className="flex-1">
            <Button className="w-full" size="lg">
              {hasNormalSession ? (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Study Now ({stats.dueReviews + stats.dueLearning + stats.newAvailable} cards)
                </>
              ) : hasLearningOnly ? (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Continue Reviewing ({stats.dueLearning} card{stats.dueLearning !== 1 ? "s" : ""} due)
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Learn More Cards
                </>
              )}
            </Button>
          </Link>
        ) : (
          <Button className="flex-1" size="lg" disabled>
            No cards due
          </Button>
        )}
        <Link href={`/decks/${deckId}/cards`}>
          <Button variant="outline" size="lg" className="w-full sm:w-auto">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Browse Cards
          </Button>
        </Link>
        {stats.learned > 0 && (
          <Button
            variant="outline"
            size="lg"
            className="w-full sm:w-auto text-error border-error/30 hover:bg-error/10"
            onClick={() => setShowResetModal(true)}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset Progress
          </Button>
        )}
      </div>

      {/* Reset Progress Confirmation Modal */}
      <Modal
        isOpen={showResetModal}
        onClose={() => !isResetting && setShowResetModal(false)}
        title="Reset Progress"
        size="sm"
      >
        <div className="space-y-3">
          <p className="text-muted-foreground">
            Are you sure you want to reset all your progress for <strong className="text-foreground">{deck.name}</strong>?
          </p>
          <p className="text-sm text-muted-foreground">
            This will erase all {stats.learned} learned card{stats.learned !== 1 ? "s" : ""}, including mastery levels, review history, and scheduling data. This action cannot be undone.
          </p>
        </div>
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => setShowResetModal(false)}
            disabled={isResetting}
          >
            Cancel
          </Button>
          <Button
            variant="error"
            onClick={handleResetProgress}
            disabled={isResetting}
          >
            {isResetting ? "Resetting..." : "Reset Progress"}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Statistics */}
      <DeckStats stats={stats} />
    </div>
  );
}
