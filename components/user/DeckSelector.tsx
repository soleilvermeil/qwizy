"use client";

import Link from "next/link";
import { Card, CardContent, Button } from "@/components/ui";

interface Field {
  id: string;
  name: string;
}

interface DeckProgress {
  totalCards: number;
  learnedCards: number;
  dueCards: number;
  newCards: number;
}

interface Deck {
  id: string;
  name: string;
  description: string | null;
  fields: Field[];
  _count: {
    cards: number;
  };
  progress?: DeckProgress;
}

interface DeckSelectorProps {
  decks: Deck[];
}

export function DeckSelector({ decks }: DeckSelectorProps) {
  if (decks.length === 0) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary mb-4">
              <svg
                className="w-8 h-8 text-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              No decks available
            </h3>
            <p className="text-muted">
              Ask an admin to create some flashcard decks for you to study.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {decks.map((deck) => (
        <Card key={deck.id} hover>
          <CardContent>
            <div className="flex flex-col h-full">
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">
                  {deck.name}
                </h3>
                {deck.description && (
                  <p className="text-sm text-muted mb-3 line-clamp-2">
                    {deck.description}
                  </p>
                )}

                <div className="flex items-center gap-2 text-sm text-muted mb-3">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                  <span>{deck._count.cards} cards</span>
                </div>

                {deck.progress && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">Progress</span>
                      <span className="text-foreground">
                        {deck.progress.learnedCards} / {deck.progress.totalCards}
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{
                          width: `${
                            deck.progress.totalCards > 0
                              ? (deck.progress.learnedCards / deck.progress.totalCards) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    {(deck.progress.dueCards > 0 || deck.progress.newCards > 0) && (
                      <div className="flex gap-3 text-xs">
                        {deck.progress.dueCards > 0 && (
                          <span className="text-warning">
                            {deck.progress.dueCards} due
                          </span>
                        )}
                        {deck.progress.newCards > 0 && (
                          <span className="text-primary">
                            {deck.progress.newCards} new
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-4">
                <Link href={`/decks/${deck.id}`} className="flex-1">
                  <Button variant="outline" fullWidth>
                    View Stats
                  </Button>
                </Link>
                <Link href={`/learn/${deck.id}`} className="flex-1">
                  <Button fullWidth>
                    {(() => {
                      const poolSize = (deck.progress?.dueCards ?? 0) + (deck.progress?.newCards ?? 0);
                      return poolSize > 0 ? `Start (${poolSize})` : "Start";
                    })()}
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
