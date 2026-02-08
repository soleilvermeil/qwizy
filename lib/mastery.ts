/**
 * Mastery Level Utilities
 * 
 * Categorizes cards based on learning progress:
 * - Not Seen: No progress record
 * - Learning: Just started (0-1 repetitions)
 * - Review: Active review (2-4 repetitions, interval < 21 days)
 * - Mastered: Well-known (5+ repetitions or interval >= 21 days)
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
 * Calculate mastery level based on progress data
 */
export function getMasteryLevel(
  repetitions: number | null | undefined,
  interval: number | null | undefined
): MasteryLevel {
  // No progress = not seen
  if (repetitions === null || repetitions === undefined) {
    return "not_seen";
  }

  const reps = repetitions;
  const int = interval || 0;

  // Mastered: 5+ repetitions OR interval >= 21 days
  if (reps >= 5 || int >= 21) {
    return "mastered";
  }

  // Review: 2-4 repetitions with interval < 21 days
  if (reps >= 2 && reps <= 4) {
    return "review";
  }

  // Learning: 0-1 repetitions
  return "learning";
}

/**
 * Get mastery info for display
 */
export function getMasteryInfo(level: MasteryLevel): MasteryInfo {
  return MASTERY_LEVELS[level];
}

/**
 * Get mastery level from progress record
 */
export function getMasteryFromProgress(progress: {
  repetitions: number;
  interval: number;
} | null): MasteryLevel {
  if (!progress) {
    return "not_seen";
  }
  return getMasteryLevel(progress.repetitions, progress.interval);
}

/**
 * Count cards by mastery level
 */
export function countByMastery<T>(
  cards: T[],
  getProgress: (card: T) => { repetitions: number; interval: number } | null
): Record<MasteryLevel, number> {
  const counts: Record<MasteryLevel, number> = {
    not_seen: 0,
    learning: 0,
    review: 0,
    mastered: 0,
  };

  for (const card of cards) {
    const progress = getProgress(card);
    const level = getMasteryFromProgress(progress);
    counts[level]++;
  }

  return counts;
}

/**
 * Filter cards by mastery level
 */
export function filterByMastery<T>(
  cards: T[],
  level: MasteryLevel,
  getProgress: (card: T) => { repetitions: number; interval: number } | null
): T[] {
  return cards.filter((card) => {
    const progress = getProgress(card);
    return getMasteryFromProgress(progress) === level;
  });
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
export function formatInterval(interval: number): string {
  if (interval === 0) {
    return "New";
  }
  if (interval === 1) {
    return "1 day";
  }
  if (interval < 7) {
    return `${interval} days`;
  }
  if (interval < 30) {
    const weeks = Math.floor(interval / 7);
    return weeks === 1 ? "1 week" : `${weeks} weeks`;
  }
  if (interval < 365) {
    const months = Math.floor(interval / 30);
    return months === 1 ? "1 month" : `${months} months`;
  }
  const years = Math.floor(interval / 365);
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
