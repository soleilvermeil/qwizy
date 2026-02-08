/**
 * SM-2 Algorithm Implementation
 * Based on the SuperMemo 2 algorithm by Piotr Wozniak
 * 
 * Rating scale:
 * - failed (q=1): Complete blackout, wrong response
 * - hard (q=3): Correct with serious difficulty
 * - good (q=4): Correct with some hesitation
 * - easy (q=5): Perfect response without hesitation
 */

export type Rating = "failed" | "hard" | "good" | "easy";

export interface SM2Result {
  easinessFactor: number;
  interval: number;
  repetitions: number;
  dueDate: Date;
}

// Map our ratings to SM-2 quality values
const ratingToQuality: Record<Rating, number> = {
  failed: 1,
  hard: 3,
  good: 4,
  easy: 5,
};

/**
 * Calculate the next review date using the SM-2 algorithm
 */
export function calculateNextReview(
  rating: Rating,
  currentEF: number,
  currentInterval: number,
  repetitions: number
): SM2Result {
  const quality = ratingToQuality[rating];

  let newEF: number;
  let newInterval: number;
  let newRepetitions: number;

  if (quality < 3) {
    // Failed - reset repetitions and start over
    // SM-2 specifies: do NOT change the E-Factor on failure
    newEF = currentEF;
    newRepetitions = 0;
    newInterval = 1; // Review again tomorrow
  } else {
    // Successful review - update easiness factor
    // EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
    newEF = currentEF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

    // EF should never go below 1.3
    newEF = Math.max(1.3, newEF);

    newRepetitions = repetitions + 1;

    if (newRepetitions === 1) {
      newInterval = 1; // First successful review: 1 day
    } else if (newRepetitions === 2) {
      newInterval = 6; // Second successful review: 6 days
    } else {
      // Subsequent reviews: multiply by EF
      newInterval = Math.round(currentInterval * newEF);
    }

    // Apply modifiers based on rating
    if (rating === "easy") {
      // Easy responses get a bonus interval (at least 4 days to graduate early)
      newInterval = Math.max(4, Math.round(newInterval * 1.3));
    } else if (rating === "hard") {
      // Hard responses get a slight reduction
      newInterval = Math.round(newInterval * 0.8);
      // But never less than 1 day
      newInterval = Math.max(1, newInterval);
    }
  }

  // Calculate due date
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + newInterval);
  dueDate.setHours(0, 0, 0, 0);

  return {
    easinessFactor: newEF,
    interval: newInterval,
    repetitions: newRepetitions,
    dueDate,
  };
}

/**
 * Preview the next interval for each possible rating.
 * Used to show "1 day", "6 days", etc. on the rating buttons.
 */
export type IntervalPreviews = Record<Rating, number>;

export function previewAllRatings(
  currentEF: number,
  currentInterval: number,
  repetitions: number
): IntervalPreviews {
  const ratings: Rating[] = ["failed", "hard", "good", "easy"];
  const previews = {} as IntervalPreviews;

  for (const rating of ratings) {
    const result = calculateNextReview(rating, currentEF, currentInterval, repetitions);
    previews[rating] = result.interval;
  }

  return previews;
}

/**
 * Check if a card is due for review
 */
export function isDue(dueDate: Date): boolean {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return dueDate <= now;
}

/**
 * Get cards that are due for review today
 */
export function getDueCards<T extends { dueDate: Date }>(cards: T[]): T[] {
  return cards.filter((card) => isDue(card.dueDate));
}

/**
 * Sort cards by due date (most urgent first)
 */
export function sortByDueDate<T extends { dueDate: Date }>(cards: T[]): T[] {
  return [...cards].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );
}
