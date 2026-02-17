/**
 * Distractor selection for quiz mode.
 *
 * Three strategies:
 *   TAGS                  – prefer cards sharing at least one tag with the current card
 *   LEVENSHTEIN_ANSWER    – pick cards whose answer is closest in edit distance to the correct answer
 *   LEVENSHTEIN_QUESTION  – pick cards whose question is closest in edit distance to the shown question
 */

export type DistractorStrategy = "TAGS" | "LEVENSHTEIN_ANSWER" | "LEVENSHTEIN_QUESTION";

interface CardCandidate {
  id: string;
  tags: string;
  values: { fieldId: string; value: string }[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

/** Standard Levenshtein distance between two strings. */
function levenshtein(a: string, b: string): number {
  const la = a.length;
  const lb = b.length;
  if (la === 0) return lb;
  if (lb === 0) return la;

  // Single-row DP
  let prev = new Array<number>(lb + 1);
  let curr = new Array<number>(lb + 1);

  for (let j = 0; j <= lb; j++) prev[j] = j;

  for (let i = 1; i <= la; i++) {
    curr[0] = i;
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,      // deletion
        curr[j - 1] + 1,  // insertion
        prev[j - 1] + cost // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }

  return prev[lb];
}

// ---------------------------------------------------------------------------
// Strategy: TAGS – prefer same-tag cards, then fill randomly from the rest
// ---------------------------------------------------------------------------

function selectByTags(
  currentCard: CardCandidate,
  askFieldId: string,
  candidates: { card: CardCandidate; value: string }[],
  maxDistractors: number
): string[] {
  const currentTags = parseTags(currentCard.tags);

  const sameTag: { card: CardCandidate; value: string }[] = [];
  const other: { card: CardCandidate; value: string }[] = [];

  for (const c of candidates) {
    if (currentTags.size > 0) {
      const cardTags = parseTags(c.card.tags);
      let shared = false;
      for (const tag of currentTags) {
        if (cardTags.has(tag)) {
          shared = true;
          break;
        }
      }
      if (shared) {
        sameTag.push(c);
      } else {
        other.push(c);
      }
    } else {
      other.push(c);
    }
  }

  const ordered = [...shuffle(sameTag), ...shuffle(other)];
  return dedup(ordered, maxDistractors);
}

// ---------------------------------------------------------------------------
// Strategy: LEVENSHTEIN_ANSWER – pick cards whose answer is closest in edit distance
// ---------------------------------------------------------------------------

function selectByLevenshteinAnswer(
  correctValue: string,
  candidates: { card: CardCandidate; value: string }[],
  maxDistractors: number
): string[] {
  const scored = candidates.map((c) => ({
    ...c,
    dist: levenshtein(correctValue.toLowerCase(), c.value.toLowerCase()),
  }));

  scored.sort((a, b) => a.dist - b.dist || Math.random() - 0.5);

  return dedup(scored, maxDistractors);
}

// ---------------------------------------------------------------------------
// Strategy: LEVENSHTEIN_QUESTION – pick cards whose question (show field) is
//   closest in edit distance to the current card's question
// ---------------------------------------------------------------------------

function selectByLevenshteinQuestion(
  currentShowValue: string,
  showFieldId: string,
  candidates: { card: CardCandidate; value: string }[],
  maxDistractors: number
): string[] {
  const scored = candidates.map((c) => {
    const candidateShowValue =
      c.card.values.find((v) => v.fieldId === showFieldId)?.value || "";
    return {
      ...c,
      dist: levenshtein(
        currentShowValue.toLowerCase(),
        candidateShowValue.toLowerCase()
      ),
    };
  });

  scored.sort((a, b) => a.dist - b.dist || Math.random() - 0.5);

  return dedup(scored, maxDistractors);
}

// ---------------------------------------------------------------------------
// Shared deduplication
// ---------------------------------------------------------------------------

function dedup(
  ordered: { value: string }[],
  max: number
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of ordered) {
    if (result.length >= max) break;
    if (!item.value || seen.has(item.value)) continue;
    seen.add(item.value);
    result.push(item.value);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Select distractor values for a quiz question.
 *
 * @param currentCard       The card being asked
 * @param showFieldId       The field shown as the question prompt
 * @param askFieldId        The field whose value the user must guess
 * @param allCards          All cards in the deck (including currentCard)
 * @param maxDistractors    How many distractors to return (quizChoices - 1)
 * @param strategy          Which selection strategy to use
 * @returns Array of distractor answer strings (ask-field values)
 */
export function getDistractors(
  currentCard: CardCandidate,
  showFieldId: string,
  askFieldId: string,
  allCards: CardCandidate[],
  maxDistractors: number,
  strategy: DistractorStrategy = "TAGS"
): string[] {
  const correctValue =
    currentCard.values.find((v) => v.fieldId === askFieldId)?.value || "";

  // Build candidate list: exclude current card, empty answers, duplicate answers
  const candidates: { card: CardCandidate; value: string }[] = [];
  for (const card of allCards) {
    if (card.id === currentCard.id) continue;
    const value =
      card.values.find((v) => v.fieldId === askFieldId)?.value || "";
    if (!value || value === correctValue) continue;
    candidates.push({ card, value });
  }

  switch (strategy) {
    case "LEVENSHTEIN_ANSWER":
      return selectByLevenshteinAnswer(correctValue, candidates, maxDistractors);
    case "LEVENSHTEIN_QUESTION": {
      const currentShowValue =
        currentCard.values.find((v) => v.fieldId === showFieldId)?.value || "";
      return selectByLevenshteinQuestion(
        currentShowValue, showFieldId, candidates, maxDistractors
      );
    }
    case "TAGS":
    default:
      return selectByTags(currentCard, askFieldId, candidates, maxDistractors);
  }
}
