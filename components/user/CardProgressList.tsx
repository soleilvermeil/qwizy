"use client";

import { Card, CardContent } from "@/components/ui";
import { MASTERY_LEVELS, formatInterval, formatDueDate, type MasteryLevel } from "@/lib/mastery";

interface CardProgress {
  repetitions: number;
  interval: number;
  easinessFactor: number;
  dueDate: string | Date;
  lastReviewed: string | Date | null;
}

interface CardData {
  id: string;
  position: number;
  values: Record<string, string>;
  mastery: MasteryLevel;
  progress: CardProgress | null;
}

interface Field {
  id: string;
  name: string;
  position: number;
}

interface CardProgressListProps {
  cards: CardData[];
  fields: Field[];
  onCardClick?: (cardId: string) => void;
}

export function CardProgressList({ cards, fields, onCardClick }: CardProgressListProps) {
  if (cards.length === 0) {
    return (
      <div className="text-center py-12">
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <p className="text-muted-foreground">No cards in this category</p>
      </div>
    );
  }

  // Get the first two fields for display (usually front/back)
  const displayFields = fields.slice(0, 2);

  return (
    <div className="space-y-3">
      {cards.map((card) => {
        const masteryInfo = MASTERY_LEVELS[card.mastery];
        const masteryColorClass = {
          not_seen: "bg-gray-100 text-gray-600",
          learning: "bg-primary/10 text-primary",
          review: "bg-warning/10 text-warning",
          mastered: "bg-success/10 text-success",
        }[card.mastery];

        return (
          <Card
            key={card.id}
            hover
            className="cursor-pointer"
            onClick={() => onCardClick?.(card.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                {/* Card Content */}
                <div className="flex-1 min-w-0">
                  {displayFields.map((field, index) => {
                    const value = card.values[field.id] || "";
                    return (
                      <div key={field.id} className={index > 0 ? "mt-1" : ""}>
                        <span className="text-xs text-muted-foreground">
                          {field.name}:
                        </span>
                        <p className={`truncate ${index === 0 ? "font-medium" : "text-sm text-muted-foreground"}`}>
                          {value || <span className="italic text-muted">Empty</span>}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Progress Info */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${masteryColorClass}`}>
                    {masteryInfo.label}
                  </span>
                  
                  {card.progress && (
                    <div className="text-xs text-muted-foreground text-right">
                      <div>{formatInterval(card.progress.interval)}</div>
                      <div>{formatDueDate(card.progress.dueDate)}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Stats for cards with progress */}
              {card.progress && card.progress.repetitions > 0 && (
                <div className="mt-3 pt-3 border-t border-border flex gap-4 text-xs text-muted-foreground">
                  <div>
                    <span className="font-medium">{card.progress.repetitions}</span> reviews
                  </div>
                  <div>
                    EF: <span className="font-medium">{card.progress.easinessFactor.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
