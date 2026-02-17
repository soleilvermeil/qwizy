/**
 * Distractor selection for quiz mode.
 *
 * Picks distractor answer values from other cards in the same deck,
 * preferring cards that share at least one tag with the current card.
 */

interface CardCandidate {
  id: string;
  tags: string;
  values: { fieldId: string; value: string }[];
}

function parseTags(tags: string): Set<string> {
  if (!tags || tags.trim() === "") return new Set();
  return new Set(
    tags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0)
  );
}

function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Select distractor values for a quiz question.
 *
 * @param currentCard  The card being asked
 * @param askFieldId   The field whose value the user must guess
 * @param allCards     All cards in the deck (including currentCard)
 * @param maxDistractors  How many distractors to return (quizChoices - 1)
 * @returns Array of distractor answer strings (ask-field values)
 */
export function getDistractors(
  currentCard: CardCandidate,
  askFieldId: string,
  allCards: CardCandidate[],
  maxDistractors: number
): string[] {
  const correctValue =
    currentCard.values.find((v) => v.fieldId === askFieldId)?.value || "";

  const currentTags = parseTags(currentCard.tags);

  // Partition candidates into same-tag and other
  const sameTag: CardCandidate[] = [];
  const other: CardCandidate[] = [];

  for (const card of allCards) {
    if (card.id === currentCard.id) continue;

    const cardAnswer =
      card.values.find((v) => v.fieldId === askFieldId)?.value || "";

    // Skip cards with empty answer or identical answer to correct one
    if (!cardAnswer || cardAnswer === correctValue) continue;

    if (currentTags.size > 0) {
      const cardTags = parseTags(card.tags);
      let shared = false;
      for (const tag of currentTags) {
        if (cardTags.has(tag)) {
          shared = true;
          break;
        }
      }
      if (shared) {
        sameTag.push(card);
      } else {
        other.push(card);
      }
    } else {
      other.push(card);
    }
  }

  // Prefer same-tag candidates, then fill with others
  const candidates = [...shuffle(sameTag), ...shuffle(other)];

  // Deduplicate by answer value to avoid showing the same text twice
  const seen = new Set<string>();
  const distractors: string[] = [];

  for (const card of candidates) {
    if (distractors.length >= maxDistractors) break;

    const value =
      card.values.find((v) => v.fieldId === askFieldId)?.value || "";
    if (!value || seen.has(value)) continue;

    seen.add(value);
    distractors.push(value);
  }

  return distractors;
}
