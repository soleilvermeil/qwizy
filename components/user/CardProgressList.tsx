"use client";

import { Card, CardContent } from "@/components/ui";
import { MASTERY_LEVELS, getMasteryScore, formatDueDate, type MasteryLevel } from "@/lib/mastery";

interface QuestionTypeProgress {
  showFieldId: string;
  askFieldId: string;
  showFieldName: string;
  askFieldName: string;
  useAsQuestion?: boolean;
  useAsExplanation?: boolean;
  progress: {
    stability: number;
    difficulty: number;
    state: number;
    reps: number;
    lapses: number;
    scheduledDays: number;
    elapsedDays: number;
    learningSteps: number;
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

const STATE_LABELS: Record<number, string> = {
  0: "New",
  1: "Learning",
  2: "Review",
  3: "Relearning",
};

/**
 * Find the index of the question type with the lowest stability.
 * Only considers types where useAsQuestion is true (or undefined for backward compat).
 * This is the one that determines the card's mastery classification.
 * Returns -1 if no progress exists.
 */
function getDeterminingQtIndex(questionTypeProgress: QuestionTypeProgress[]): number {
  let minStability = Infinity;
  let minIndex = -1;

  for (let i = 0; i < questionTypeProgress.length; i++) {
    const qt = questionTypeProgress[i];
    // Skip explanation-only types
    if (qt.useAsQuestion === false) continue;

    const stability = qt.progress !== null ? qt.progress.stability : null;
    if (stability !== null && stability < minStability) {
      minStability = stability;
      minIndex = i;
    }
  }

  // If some question types have no progress but others do, the missing ones
  // count as stability 0. Check if any null progress would be the lowest.
  const hasAnyQuestionProgress = questionTypeProgress.some(
    (qt) => qt.useAsQuestion !== false && qt.progress !== null
  );
  if (hasAnyQuestionProgress) {
    for (let i = 0; i < questionTypeProgress.length; i++) {
      const qt = questionTypeProgress[i];
      if (qt.useAsQuestion === false) continue;
      if (qt.progress === null && 0 < minStability) {
        return i;
      }
    }
  }

  return minIndex;
}

function FsrsParam({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
      <span className={`text-xs font-medium ${highlight ? "text-primary" : "text-foreground"}`}>
        {value}
      </span>
    </div>
  );
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
          low: "bg-primary/10 text-primary",
          medium: "bg-warning/10 text-warning",
          high: "bg-success/10 text-success",
        }[card.mastery];

        const hasAnyProgress = card.questionTypeProgress.some(
          (qt) => qt.progress !== null
        );

        const determiningIndex = getDeterminingQtIndex(card.questionTypeProgress);

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

              {/* Per-question-type FSRS parameters */}
              {(hasAnyProgress || card.questionTypeProgress.length > 0) && (
                <div className="mt-3 pt-3 border-t border-border space-y-2">
                  {card.questionTypeProgress.map((qt, qtIndex) => {
                    const isDetermining = qtIndex === determiningIndex;
                    const isExplanationOnly = qt.useAsQuestion === false && qt.useAsExplanation === true;

                    return (
                      <div
                        key={`${qt.showFieldId}-${qt.askFieldId}`}
                        className={`text-xs rounded-md p-2 ${
                          isDetermining
                            ? "border-l-2 border-l-primary bg-primary/5"
                            : "border-l-2 border-l-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-muted-foreground font-medium">
                            {qt.showFieldName} &rarr; {qt.askFieldName}
                          </span>
                          {/* {qt.useAsQuestion !== false && (
                            <span className="text-[10px] px-1 py-0.5 rounded bg-warning/10 text-warning font-medium">Q</span>
                          )}
                          {qt.useAsExplanation && (
                            <span className="text-[10px] px-1 py-0.5 rounded bg-success/10 text-success font-medium">E</span>
                          )} */}
                          {isDetermining && hasAnyProgress && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                              lowest stability
                            </span>
                          )}
                        </div>
                        {isExplanationOnly ? (
                          <div className="text-muted italic">
                            Explanation only &mdash; no tracking
                          </div>
                        ) : qt.progress ? (
                          <div className="grid grid-cols-3 sm:grid-cols-5 gap-x-4 gap-y-1.5">
                            <FsrsParam
                              label="State"
                              value={`${qt.progress.state} (${STATE_LABELS[qt.progress.state] ?? "?"})`}
                            />
                            <FsrsParam
                              label="Stability"
                              value={`${qt.progress.stability.toFixed(2)} d`}
                              highlight={isDetermining}
                            />
                            <FsrsParam
                              label="Difficulty"
                              value={qt.progress.difficulty.toFixed(2)}
                            />
                            <FsrsParam
                              label="Reps"
                              value={qt.progress.reps}
                            />
                            <FsrsParam
                              label="Lapses"
                              value={qt.progress.lapses}
                            />
                            <FsrsParam
                              label="Interval"
                              value={`${qt.progress.scheduledDays} d`}
                            />
                            <FsrsParam
                              label="Elapsed"
                              value={`${qt.progress.elapsedDays} d`}
                            />
                            <FsrsParam
                              label="Steps"
                              value={qt.progress.learningSteps}
                            />
                            <FsrsParam
                              label="Due"
                              value={formatDueDate(qt.progress.dueDate)}
                            />
                            <FsrsParam
                              label="Last Review"
                              value={qt.progress.lastReviewed ? formatDueDate(qt.progress.lastReviewed) : "Never"}
                            />
                            {/* {isDetermining && (
                              <div className="col-span-3 sm:col-span-5 mt-0.5">
                                <span className="text-[10px] text-primary">
                                  score = min(1, {qt.progress.stability.toFixed(2)} / 365) = {(getMasteryScore(qt.progress.stability) * 100).toFixed(1)}%
                                </span>
                              </div>
                            )} */}
                          </div>
                        ) : (
                          <div className="text-muted italic">
                            Not yet studied
                            {isDetermining && (
                              <span className="text-primary not-italic ml-2 text-[10px]">
                                (effective stability = 0)
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
