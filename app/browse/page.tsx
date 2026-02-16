"use client";

import { useState, useEffect } from "react";
import { DeckBrowser } from "@/components/user/DeckBrowser";

interface Deck {
  id: string;
  name: string;
  description: string | null;
  _count: {
    cards: number;
  };
}

export default function BrowsePage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [enrolledDeckIds, setEnrolledDeckIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDecks = async () => {
      try {
        const response = await fetch("/api/decks");
        const data = await response.json();
        setDecks(data.decks);
        setEnrolledDeckIds(data.enrolledDeckIds || []);
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
      <div>
        <h1 className="text-2xl font-bold text-foreground">Deck Library</h1>
        <p className="text-muted">
          Browse available decks and add them to your collection
        </p>
      </div>

      <DeckBrowser decks={decks} initialEnrolledIds={enrolledDeckIds} />
    </div>
  );
}
