"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { DeckSelector } from "@/components/user/DeckSelector";

interface Field {
  id: string;
  name: string;
}

interface DeckProgress {
  totalCards: number;
  learnedCards: number;
  dueCards: number;
  dueReviews: number;
  dueLearning: number;
  newCards: number;
  hasMoreNewCards: boolean;
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

export default function UserDecksPage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDecks = async () => {
      try {
        const response = await fetch("/api/user/decks");
        const data = await response.json();
        setDecks(data.decks);
      } catch (error) {
        console.error("Error fetching decks:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDecks();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Decks</h1>
          <p className="text-muted">Choose a deck to start learning</p>
        </div>
        <Link
          href="/browse"
          className="text-sm font-medium text-primary hover:text-primary-hover transition-colors"
        >
          Browse more
        </Link>
      </div>

      <DeckSelector decks={decks} />
    </div>
  );
}
