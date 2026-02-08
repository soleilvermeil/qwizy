"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { CardProgressList } from "@/components/user";
import { MASTERY_LEVELS, type MasteryLevel } from "@/lib/mastery";

interface Field {
  id: string;
  name: string;
  position: number;
}

interface CardProgress {
  repetitions: number;
  interval: number;
  easinessFactor: number;
  dueDate: string;
  lastReviewed: string | null;
}

interface CardData {
  id: string;
  position: number;
  values: Record<string, string>;
  mastery: MasteryLevel;
  progress: CardProgress | null;
}

interface DeckData {
  id: string;
  name: string;
  fields: Field[];
}

const MASTERY_TABS: MasteryLevel[] = ["not_seen", "learning", "review", "mastered"];

export default function UserCardsPage() {
  const params = useParams();
  const router = useRouter();
  const deckId = params.deckId as string;

  const [deck, setDeck] = useState<DeckData | null>(null);
  const [cards, setCards] = useState<CardData[]>([]);
  const [counts, setCounts] = useState<Record<MasteryLevel, number>>({
    not_seen: 0,
    learning: 0,
    review: 0,
    mastered: 0,
  });
  const [activeTab, setActiveTab] = useState<MasteryLevel | "all">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCards = useCallback(async () => {
    try {
      setIsLoading(true);
      const url = activeTab === "all"
        ? `/api/user/decks/${deckId}/cards`
        : `/api/user/decks/${deckId}/cards?mastery=${activeTab}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError("Deck not found");
          return;
        }
        throw new Error("Failed to fetch cards");
      }

      const data = await response.json();
      setDeck(data.deck);
      setCards(data.cards);
      setCounts(data.counts);
    } catch (err) {
      console.error("Error fetching cards:", err);
      setError("Failed to load cards");
    } finally {
      setIsLoading(false);
    }
  }, [deckId, activeTab]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  if (isLoading && !deck) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !deck) {
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
        </div>
      </div>
    );
  }

  const totalCards = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push(`/decks/${deckId}`)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Stats
        </button>
        <h1 className="text-2xl font-bold text-foreground">{deck.name}</h1>
        <p className="text-muted-foreground">Browse your cards by mastery level</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1 overflow-x-auto pb-px -mb-px">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === "all"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            All ({totalCards})
          </button>
          {MASTERY_TABS.map((level) => {
            const info = MASTERY_LEVELS[level];
            const count = counts[level];
            
            return (
              <button
                key={level}
                onClick={() => setActiveTab(level)}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === level
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {info.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Cards List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <CardProgressList
          cards={cards}
          fields={deck.fields}
        />
      )}
    </div>
  );
}
