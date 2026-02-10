"use client";

import Link from "next/link";
import { Card, CardContent, Button } from "@/components/ui";

interface SessionStats {
  total: number;
  easy: number;
  good: number;
  hard: number;
  failed: number;
}

interface SessionSummaryProps {
  deckName: string;
  stats: SessionStats;
  onContinueReview?: () => void;
  pendingDueCount?: number;
  onStudyMore: () => void;
  hasMoreNewCards?: boolean;
}

export function SessionSummary({
  deckName,
  stats,
  onContinueReview,
  pendingDueCount = 0,
  onStudyMore,
  hasMoreNewCards = false,
}: SessionSummaryProps) {
  const accuracy =
    stats.total > 0
      ? Math.round(((stats.easy + stats.good) / stats.total) * 100)
      : 0;

  return (
    <Card variant="elevated" padding="lg" className="max-w-lg mx-auto">
      <CardContent>
        <div className="text-center space-y-6">
          {/* Success icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success/10">
            <svg
              className="w-10 h-10 text-success"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          {/* Message */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Session Complete!
            </h2>
            <p className="text-muted">
              Great job studying &quot;{deckName}&quot;
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-border">
            <div>
              <p className="text-3xl font-bold text-foreground">{stats.total}</p>
              <p className="text-sm text-muted">Cards Reviewed</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">{accuracy}%</p>
              <p className="text-sm text-muted">Accuracy</p>
            </div>
          </div>

          {/* Rating breakdown */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-2 bg-success/10 rounded-lg">
              <p className="text-lg font-semibold text-success">{stats.easy}</p>
              <p className="text-xs text-muted">Easy</p>
            </div>
            <div className="p-2 bg-warning/10 rounded-lg">
              <p className="text-lg font-semibold text-warning">{stats.good}</p>
              <p className="text-xs text-muted">Good</p>
            </div>
            <div className="p-2 bg-primary/10 rounded-lg">
              <p className="text-lg font-semibold text-primary">{stats.hard}</p>
              <p className="text-xs text-muted">Hard</p>
            </div>
            <div className="p-2 bg-error/10 rounded-lg">
              <p className="text-lg font-semibold text-error">{stats.failed}</p>
              <p className="text-xs text-muted">Failed</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-4">
            {pendingDueCount > 0 && onContinueReview ? (
              <>
                <Button onClick={onContinueReview} fullWidth>
                  Continue Reviewing ({pendingDueCount} card{pendingDueCount !== 1 ? "s" : ""} due)
                </Button>
                <Link href="/decks">
                  <Button variant="secondary" fullWidth>
                    Back to Decks
                  </Button>
                </Link>
              </>
            ) : (
              <>
                {hasMoreNewCards && (
                  <Button onClick={onStudyMore} fullWidth>
                    Learn More Cards
                  </Button>
                )}
                <Link href="/decks">
                  <Button variant={hasMoreNewCards ? "secondary" : "primary"} fullWidth>
                    Back to Decks
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
