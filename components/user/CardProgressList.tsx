"use client";

import { Card, CardContent } from "@/components/ui";
import { MASTERY_LEVELS, formatInterval, formatDueDate, type MasteryLevel } from "@/lib/mastery";

interface QuestionTypeProgress {
  showFieldId: string;
  askFieldId: string;
  showFieldName: string;
  askFieldName: string;
  progress: {
    repetitions: number;
    interval: number;
    easinessFactor: number;
    dueDate: string | Date;
    lastReviewed: string | Date | null;
  } | null;
}

interface CardData {
  id: string;
  position: number;
  values: Record<string, string>;
  mastery: MasteryLevel;
  questionTypeProgress: QuestionTypeProgress[];
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

        const hasAnyProgress = card.questionTypeProgress.some(
          (qt) => qt.progress !== null
        );

        return (
          <Card
            key={card.id}
            hover
            className="cursor-pointer"
            onClick={() => onCardClick?.(card.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                {/* Card Content - All Fields */}
                <div className="flex-1 min-w-0">
                  {fields.map((field, index) => {
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

                {/* Mastery Badge */}
                <div className="flex-shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${masteryColorClass}`}>
                    {masteryInfo.label}
                  </span>
                </div>
              </div>

              {/* Per-question-type stats */}
              {hasAnyProgress && (
                <div className="mt-3 pt-3 border-t border-border space-y-2">
                  {card.questionTypeProgress.map((qt) => (
                    <div
                      key={`${qt.showFieldId}-${qt.askFieldId}`}
                      className="text-xs"
                    >
                      <div className="text-muted-foreground font-medium mb-0.5">
                        {qt.showFieldName} &rarr; {qt.askFieldName}
                      </div>
                      {qt.progress ? (
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-muted-foreground">
                          <div>
                            <span className="font-medium text-foreground">{qt.progress.repetitions}</span> reviews
                          </div>
                          <div>
                            EF: <span className="font-medium text-foreground">{qt.progress.easinessFactor.toFixed(2)}</span>
                          </div>
                          <div>
                            Interval: <span className="font-medium text-foreground">{formatInterval(qt.progress.interval)}</span>
                          </div>
                          <div>
                            Due: <span className="font-medium text-foreground">{formatDueDate(qt.progress.dueDate)}</span>
                          </div>
                          {qt.progress.lastReviewed && (
                            <div>
                              Last: <span className="font-medium text-foreground">{formatDueDate(qt.progress.lastReviewed)}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-muted italic">Not yet studied</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
