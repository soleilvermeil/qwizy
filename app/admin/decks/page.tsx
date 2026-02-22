"use client";

import { useState, useEffect } from "react";
import { Button, Modal } from "@/components/ui";
import { DeckList, DeckForm } from "@/components/admin";

interface Field {
  id: string;
  name: string;
  position: number;
}

interface Deck {
  id: string;
  name: string;
  description: string | null;
  fields: Field[];
  _count: {
    cards: number;
  };
  createdAt: string;
  createdBy?: { id: string; username: string } | null;
}

export default function AdminDecksPage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDecks = async () => {
    try {
      const response = await fetch("/api/decks");
      const data = await response.json();
      setDecks(data.decks);
    } catch (error) {
      console.error("Error fetching decks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDecks();
  }, []);

  const handleCreateDeck = async (data: {
    name: string;
    description: string;
    fields: { name: string }[];
  }) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create deck");
      }

      setIsCreateModalOpen(false);
      fetchDecks();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDeck = async (id: string) => {
    try {
      const response = await fetch(`/api/decks/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete deck");
      }

      setDecks(decks.filter((d) => d.id !== id));
    } catch (error) {
      console.error("Error deleting deck:", error);
      alert("Failed to delete deck");
    }
  };

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
          <h1 className="text-2xl font-bold text-foreground">Decks</h1>
          <p className="text-muted">Manage your flashcard decks</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Deck
        </Button>
      </div>

      <DeckList decks={decks} onDelete={handleDeleteDeck} />

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Deck"
        size="lg"
      >
        <DeckForm
          onSubmit={handleCreateDeck}
          onCancel={() => setIsCreateModalOpen(false)}
          isLoading={isSubmitting}
        />
      </Modal>
    </div>
  );
}
