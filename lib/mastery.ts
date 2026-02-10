/**
 * Mastery Level Utilities
 *
 * Categorizes cards based on the lowest stability across all question types:
 * - Not Seen: No progress record for any question type
 * - Learning: mastery score < 33%
 * - Review: 33% <= mastery score < 67%
 * - Mastered: mastery score >= 67%
 *
 * Mastery score: f(stability) = min(1, log(stability) / log(365))
 */

export type MasteryLevel = "not_seen" | "learning" | "review" | "mastered";

export interface MasteryInfo {
  level: MasteryLevel;
  label: string;
  color: string;
  description: string;
}

export const MASTERY_LEVELS: Record<MasteryLevel, MasteryInfo> = {
  not_seen: {
    level: "not_seen",
    label: "Not Seen",
    color: "muted",
    description: "Cards you haven't studied yet",
  },
  learning: {
    level: "learning",
    label: "Learning",
    color: "primary",
    description: "Cards you're just starting to learn",
  },
  review: {
    level: "review",
    label: "Review",
    color: "warning",
    description: "Cards in active review cycle",
  },
  mastered: {
    level: "mastered",
    label: "Mastered",
    color: "success",
    description: "Cards you know well",
  },
};

/**
 * Compute the mastery score for a given stability.
 * f(stability) = min(1, log(stability) / log(365))
 * Returns a value between 0 and 1.
 */
export function getMasteryScore(stability: number): number {
  if (stability <= 1) return 0;
  return Math.min(1, Math.log(stability) / Math.log(365));
}

/**
 * Calculate mastery level based on the lowest stability.
 * Pass null if no progress exists at all (= "not_seen").
 * Pass a number (including 0) if at least some progress exists.
 */
export function getMasteryLevel(
  lowestStability: number | null
): MasteryLevel {
  if (lowestStability === null) {
    return "not_seen";
  }

  const score = getMasteryScore(lowestStability);

  if (score >= 0.67) return "mastered";
  if (score >= 0.33) return "review";
  return "learning";
}

/**
 * Get mastery info for display
 */
export function getMasteryInfo(level: MasteryLevel): MasteryInfo {
  return MASTERY_LEVELS[level];
}

/**
 * Compute the lowest stability for a card across all expected question types.
 * If some question types have no progress, they count as stability 0.
 * Returns null if no progress exists at all (card never seen).
 */
export function getLowestStability(
  progressStabilities: (number | null)[]
): number | null {
  if (progressStabilities.length === 0) return null;

  const hasAnyProgress = progressStabilities.some((s) => s !== null);
  if (!hasAnyProgress) return null;

  return Math.min(...progressStabilities.map((s) => s ?? 0));
}

/**
 * Get upcoming review counts for the next N days
 */
export function getUpcomingReviews<T>(
  cards: T[],
  days: number,
  getDueDate: (card: T) => Date | null
): number[] {
  const counts = new Array(days).fill(0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const card of cards) {
    const dueDate = getDueDate(card);
    if (!dueDate) continue;

    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);

    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays >= 0 && diffDays < days) {
      counts[diffDays]++;
    }
  }

  return counts;
}

/**
 * Format interval for display
 */
export function formatInterval(days: number): string {
  if (days === 0) {
    return "New";
  }
  if (days === 1) {
    return "1 day";
  }
  if (days < 7) {
    return `${days} days`;
  }
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? "1 week" : `${weeks} weeks`;
  }
  if (days < 365) {
    const months = Math.floor(days / 30);
    return months === 1 ? "1 month" : `${months} months`;
  }
  const years = Math.floor(days / 365);
  return years === 1 ? "1 year" : `${years} years`;
}

/**
 * Format due date for display
 */
export function formatDueDate(dueDate: Date | string): string {
  const date = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  const diffTime = date.getTime() - today.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return diffDays === -1 ? "Yesterday" : `${Math.abs(diffDays)} days ago`;
  }
  if (diffDays === 0) {
    return "Today";
  }
  if (diffDays === 1) {
    return "Tomorrow";
  }
  if (diffDays < 7) {
    return `In ${diffDays} days`;
  }

  return date.toLocaleDateString();
}
