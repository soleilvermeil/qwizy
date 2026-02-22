"use client";

import Link from "next/link";
import { Card, CardContent, Button } from "@/components/ui";

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

interface DeckListProps {
  decks: Deck[];
  onDelete: (id: string) => void;
}

export function DeckList({ decks, onDelete }: DeckListProps) {
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
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              No decks yet
            </h3>
            <p className="text-muted mb-4">
              Create your first deck to get started
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
                <div className="flex flex-wrap gap-2 mb-3">
                  {deck.fields.map((field) => (
                    <span
                      key={field.id}
                      className="px-2 py-0.5 text-xs bg-secondary rounded-full text-muted-foreground"
                    >
                      {field.name}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-muted">
                  {deck._count.cards} card{deck._count.cards !== 1 ? "s" : ""}
                  {deck.createdBy && (
                    <span> · by {deck.createdBy.username}</span>
                  )}
                </p>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                <Link href={`/admin/decks/${deck.id}`} className="flex-1">
                  <Button variant="secondary" size="sm" fullWidth>
                    Edit
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    if (confirm("Are you sure you want to delete this deck?")) {
                      onDelete(deck.id);
                    }
                  }}
                >
                  <svg
                    className="w-4 h-4 text-error"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
