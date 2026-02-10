/**
 * FSRS (Free Spaced Repetition Scheduler) wrapper
 *
 * Uses the ts-fsrs library for scheduling. Provides helpers to
 * reconstruct Card objects from database rows and to preview
 * intervals for the rating buttons.
 */

import {
  fsrs,
  createEmptyCard,
  Rating,
  State,
  type Card,
  type Grade,
  type RecordLogItem,
} from "ts-fsrs";

// ---------------------------------------------------------------------------
// Singleton FSRS instance (95 % target retention → shorter intervals)
// ---------------------------------------------------------------------------

const f = fsrs({ request_retention: 0.95, enable_fuzz: true });

// ---------------------------------------------------------------------------
// Our app's rating strings  →  ts-fsrs Grade enum
// ---------------------------------------------------------------------------

export type AppRating = "failed" | "hard" | "good" | "easy";

const ratingMap: Record<AppRating, Grade> = {
  failed: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
};

export function toGrade(rating: AppRating): Grade {
  return ratingMap[rating];
}

// ---------------------------------------------------------------------------
// Reconstruct a ts-fsrs Card from database fields
// ---------------------------------------------------------------------------

export interface DBProgress {
  stability: number;
  difficulty: number;
  state: number;
  reps: number;
  lapses: number;
  scheduledDays: number;
  elapsedDays: number;
  learningSteps: number;
  dueDate: Date;
  lastReviewed: Date | null;
}

export function cardFromDB(p: DBProgress): Card {
  return {
    due: new Date(p.dueDate),
    stability: p.stability,
    difficulty: p.difficulty,
    elapsed_days: p.elapsedDays,
    scheduled_days: p.scheduledDays,
    learning_steps: p.learningSteps,
    reps: p.reps,
    lapses: p.lapses,
    state: p.state as State,
    last_review: p.lastReviewed ? new Date(p.lastReviewed) : undefined,
  };
}

// ---------------------------------------------------------------------------
// Review a card and return the new state
// ---------------------------------------------------------------------------

export interface FSRSResult {
  stability: number;
  difficulty: number;
  state: number;
  reps: number;
  lapses: number;
  scheduledDays: number;
  elapsedDays: number;
  learningSteps: number;
  dueDate: Date;
}

function recordToResult(item: RecordLogItem): FSRSResult {
  const c = item.card;
  return {
    stability: c.stability,
    difficulty: c.difficulty,
    state: c.state as number,
    reps: c.reps,
    lapses: c.lapses,
    scheduledDays: c.scheduled_days,
    elapsedDays: c.elapsed_days,
    learningSteps: c.learning_steps,
    dueDate: c.due,
  };
}

/**
 * Review a card with the given rating.
 * If `progress` is null the card is treated as brand-new.
 */
export function reviewCard(
  rating: AppRating,
  progress: DBProgress | null,
  now: Date = new Date()
): FSRSResult {
  const card = progress ? cardFromDB(progress) : createEmptyCard(now);
  const grade = toGrade(rating);
  const result = f.next(card, now, grade);
  return recordToResult(result);
}

// ---------------------------------------------------------------------------
// Preview the next interval (in days) for every possible rating
// ---------------------------------------------------------------------------

export type IntervalPreviews = Record<AppRating, number>;

export function previewAllRatings(
  progress: DBProgress | null,
  now: Date = new Date()
): IntervalPreviews {
  const card = progress ? cardFromDB(progress) : createEmptyCard(now);
  const preview = f.repeat(card, now);

  return {
    failed: preview[Rating.Again].card.scheduled_days,
    hard: preview[Rating.Hard].card.scheduled_days,
    good: preview[Rating.Good].card.scheduled_days,
    easy: preview[Rating.Easy].card.scheduled_days,
  };
}

// ---------------------------------------------------------------------------
// Due-date helpers
// ---------------------------------------------------------------------------

export function isDue(dueDate: Date): boolean {
  return new Date(dueDate) <= new Date();
}

export function getDueCards<T extends { dueDate: Date }>(cards: T[]): T[] {
  return cards.filter((card) => isDue(card.dueDate));
}

export function sortByDueDate<T extends { dueDate: Date }>(cards: T[]): T[] {
  return [...cards].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );
}

// Re-export ts-fsrs types consumers might need
export { Rating, State } from "ts-fsrs";
