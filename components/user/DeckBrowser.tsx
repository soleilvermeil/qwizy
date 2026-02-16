"use client";

import { useState } from "react";
import { Card, CardContent, Button, Input } from "@/components/ui";

interface Deck {
  id: string;
  name: string;
  description: string | null;
  _count: {
    cards: number;
  };
}

interface DeckBrowserProps {
  decks: Deck[];
  initialEnrolledIds: string[];
}

export function DeckBrowser({ decks, initialEnrolledIds }: DeckBrowserProps) {
  const [search, setSearch] = useState("");
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(
    new Set(initialEnrolledIds)
  );
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  const filtered = decks.filter((deck) => {
    const q = search.toLowerCase();
    return (
      deck.name.toLowerCase().includes(q) ||
      (deck.description && deck.description.toLowerCase().includes(q))
    );
  });

  async function toggleEnroll(deckId: string) {
    const isEnrolled = enrolledIds.has(deckId);

    setLoadingIds((prev) => new Set(prev).add(deckId));

    // Optimistic update
    setEnrolledIds((prev) => {
      const next = new Set(prev);
      if (isEnrolled) {
        next.delete(deckId);
      } else {
        next.add(deckId);
      }
      return next;
    });

    try {
      const res = await fetch(`/api/user/decks/${deckId}/enroll`, {
        method: isEnrolled ? "DELETE" : "POST",
      });

      if (!res.ok) {
        // Revert on failure
        setEnrolledIds((prev) => {
          const next = new Set(prev);
          if (isEnrolled) {
            next.add(deckId);
          } else {
            next.delete(deckId);
          }
          return next;
        });
      }
    } catch {
      // Revert on error
      setEnrolledIds((prev) => {
        const next = new Set(prev);
        if (isEnrolled) {
          next.add(deckId);
        } else {
          next.delete(deckId);
        }
        return next;
      });
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(deckId);
        return next;
      });
    }
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search decks..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {filtered.length === 0 ? (
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
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                {search ? "No decks found" : "No decks available"}
              </h3>
              <p className="text-muted">
                {search
                  ? "Try a different search term."
                  : "Check back later for new decks."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((deck) => {
            const isEnrolled = enrolledIds.has(deck.id);
            const isLoading = loadingIds.has(deck.id);

            return (
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
                    </div>

                    <Button
                      variant={isEnrolled ? "outline" : "primary"}
                      fullWidth
                      disabled={isLoading}
                      isLoading={isLoading}
                      onClick={() => toggleEnroll(deck.id)}
                    >
                      {isEnrolled ? "Added" : "Add to My Decks"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
