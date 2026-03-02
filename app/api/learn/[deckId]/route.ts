import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { getNewCardsIntroducedToday } from "@/lib/daily";
import { getDistractors, type DistractorStrategy } from "@/lib/distractors";

type RouteParams = {
  params: Promise<{ deckId: string }>;
};

interface TtsConfig {
  lang: string;
  fieldId: string;
  stopAt: string | null;
}

interface HintConfig {
  fieldId: string;
  fieldName: string;
}

interface QuestionItem {
  cardId: string;
  showFieldId: string;
  askFieldId: string;
  values: { id: string; fieldId: string; value: string }[];
  progress: {
    stability: number;
    difficulty: number;
    state: number;
    scheduledDays: number;
    reps: number;
    lapses: number;
    elapsedDays: number;
    learningSteps: number;
    dueDate: Date;
    lastReviewed: Date | null;
  } | null;
  showTts: TtsConfig | null;
  askTts: TtsConfig | null;
  showHints: HintConfig[];
  askHints: HintConfig[];
}

function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// GET /api/learn/[deckId] - Get cards for a learning session
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { deckId } = await params;
    const userId = session.userId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get deck with fields and question types
    const deck = await prisma.deck.findUnique({
      where: { id: deckId },
      include: {
        fields: {
          orderBy: { position: "asc" },
        },
        questionTypes: {
          orderBy: { position: "asc" },
        },
      },
    });

    if (!deck) {
      return NextResponse.json(
        { error: "Deck not found" },
        { status: 404 }
      );
    }

    // Use configured question types, or fall back to first→second field
    // Build a field name lookup for resolving hints
    const fieldNameMap = new Map(deck.fields.map((f) => [f.id, f.name]));

    function parseHintFieldIds(csv: string | null): HintConfig[] {
      if (!csv) return [];
      return csv
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id.length > 0)
        .map((id) => ({ fieldId: id, fieldName: fieldNameMap.get(id) || id }));
    }

    interface FieldPair {
      showFieldId: string;
      askFieldId: string;
      showTts: TtsConfig | null;
      askTts: TtsConfig | null;
      showHints: HintConfig[];
      askHints: HintConfig[];
    }

    let questionPairs: FieldPair[] = [];
    const explanationPairs: FieldPair[] = [];

    if (deck.questionTypes.length > 0) {
      for (const qt of deck.questionTypes) {
        const pair: FieldPair = {
          showFieldId: qt.showFieldId,
          askFieldId: qt.askFieldId,
          showTts: qt.showTtsLang && qt.showTtsFieldId
            ? { lang: qt.showTtsLang, fieldId: qt.showTtsFieldId, stopAt: qt.showTtsStopAt }
            : null,
          askTts: qt.askTtsLang && qt.askTtsFieldId
            ? { lang: qt.askTtsLang, fieldId: qt.askTtsFieldId, stopAt: qt.askTtsStopAt }
            : null,
          showHints: parseHintFieldIds(qt.showHintFieldIds),
          askHints: parseHintFieldIds(qt.askHintFieldIds),
        };
        if (qt.useAsQuestion) questionPairs.push(pair);
        if (qt.useAsExplanation) explanationPairs.push(pair);
      }
    } else {
      if (deck.fields.length < 2) {
        return NextResponse.json(
          { error: "Deck must have at least 2 fields" },
          { status: 400 }
        );
      }
      questionPairs = [
        {
          showFieldId: deck.fields[0].id,
          askFieldId: deck.fields[1].id,
          showTts: null,
          askTts: null,
          showHints: [],
          askHints: [],
        },
      ];
    }

    // Combined field pairs for the response (all unique pairs)
    const allPairKeys = new Set<string>();
    const fieldPairs: FieldPair[] = [];
    for (const pair of [...questionPairs, ...explanationPairs]) {
      const key = `${pair.showFieldId}:${pair.askFieldId}`;
      if (!allPairKeys.has(key)) {
        allPairKeys.add(key);
        fieldPairs.push(pair);
      }
    }

    // Get user settings
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { newCardsPerDay: true },
    });

    const newCardsPerDay = user?.newCardsPerDay || 10;

    // Check if this is an "extra study" request (beyond daily limit)
    const isExtra = request.nextUrl.searchParams.get("extra") === "true";
    // Check if this is a "due only" request (continue reviewing, no new cards)
    const isDueOnly = request.nextUrl.searchParams.get("dueOnly") === "true";

    // Get all cards in deck with their values
    const allCards = await prisma.card.findMany({
      where: { deckId },
      include: {
        values: true,
      },
      orderBy: { position: "asc" },
    });

    // Get user's progress for this deck
    const userProgress = await prisma.userProgress.findMany({
      where: {
        userId,
        card: { deckId },
      },
    });

    // Build a lookup: "cardId:showFieldId:askFieldId" -> progress
    const progressMap = new Map(
      userProgress.map((p) => [`${p.cardId}:${p.showFieldId}:${p.askFieldId}`, p])
    );

    // Categorize cards into due (have progress and overdue) and new (no progress)
    // Only question pairs generate FSRS progress, so use those for categorization
    const dueQuestions: QuestionItem[] = [];
    const newCardIds: string[] = [];
    const reviewCardIds = new Set<string>();

    for (const card of allCards) {
      let hasAnyProgress = false;
      const missingPairs: FieldPair[] = [];

      for (const pair of questionPairs) {
        const key = `${card.id}:${pair.showFieldId}:${pair.askFieldId}`;
        const progress = progressMap.get(key);

        if (progress) {
          hasAnyProgress = true;
          // Check if this question is due (calendar-day granularity)
          const dueDay = new Date(progress.dueDate);
          dueDay.setHours(0, 0, 0, 0);
          if (dueDay <= today) {
            dueQuestions.push({
              cardId: card.id,
              showFieldId: pair.showFieldId,
              askFieldId: pair.askFieldId,
              values: card.values,
              progress: {
                stability: progress.stability,
                difficulty: progress.difficulty,
                state: progress.state,
                scheduledDays: progress.scheduledDays,
                reps: progress.reps,
                lapses: progress.lapses,
                elapsedDays: progress.elapsedDays,
                learningSteps: progress.learningSteps,
                dueDate: progress.dueDate,
                lastReviewed: progress.lastReviewed,
              },
              showTts: pair.showTts,
              askTts: pair.askTts,
              showHints: pair.showHints,
              askHints: pair.askHints,
            });
            reviewCardIds.add(card.id);
          }
        } else {
          missingPairs.push(pair);
        }
      }

      if (!hasAnyProgress) {
        newCardIds.push(card.id);
      } else if (missingPairs.length > 0) {
        // Card has progress for some question types but not all (e.g. user
        // quit a session early, or a new question type was added to the deck).
        // Treat the missing ones as due questions with no prior progress so
        // they are introduced without counting against the daily new-card limit.
        for (const pair of missingPairs) {
          dueQuestions.push({
            cardId: card.id,
            showFieldId: pair.showFieldId,
            askFieldId: pair.askFieldId,
            values: card.values,
            progress: null,
            showTts: pair.showTts,
            askTts: pair.askTts,
            showHints: pair.showHints,
            askHints: pair.askHints,
          });
        }
      }
    }

    // Calculate how many new cards to include in this session
    let effectiveNewCardLimit: number;

    if (isExtra) {
      // Extra mode: always serve a full batch, ignoring daily tracking
      effectiveNewCardLimit = newCardsPerDay;
    } else {
      // Normal mode: subtract cards already introduced today from daily limit
      const alreadyIntroducedToday = await getNewCardsIntroducedToday(userId, deckId);
      effectiveNewCardLimit = Math.max(0, newCardsPerDay - alreadyIntroducedToday);
    }

    // Limit new cards (by card count, not question count)
    const limitedNewCardIds = new Set(newCardIds.slice(0, effectiveNewCardLimit));
    const totalUnseenCards = newCardIds.length;

    // Generate questions for new cards (only question pairs)
    const newQuestions: QuestionItem[] = [];
    for (const card of allCards) {
      if (!limitedNewCardIds.has(card.id)) continue;

      for (const pair of questionPairs) {
        newQuestions.push({
          cardId: card.id,
          showFieldId: pair.showFieldId,
          askFieldId: pair.askFieldId,
          values: card.values,
          progress: null,
          showTts: pair.showTts,
          askTts: pair.askTts,
          showHints: pair.showHints,
          askHints: pair.askHints,
        });
      }
    }

    // Generate explanations for new cards (ordered by card position,
    // all explanations for card A, then card B, then card C)
    interface ExplanationItem {
      cardId: string;
      showFieldId: string;
      askFieldId: string;
      values: { id: string; fieldId: string; value: string }[];
      showTts: TtsConfig | null;
      askTts: TtsConfig | null;
      showHints: HintConfig[];
      askHints: HintConfig[];
    }

    const newExplanations: ExplanationItem[] = [];
    // allCards is already ordered by position from the query, but filter to new cards
    const newCardsInOrder = allCards
      .filter((c) => limitedNewCardIds.has(c.id))
      .sort((a, b) => a.position - b.position);

    for (const card of newCardsInOrder) {
      for (const pair of explanationPairs) {
        newExplanations.push({
          cardId: card.id,
          showFieldId: pair.showFieldId,
          askFieldId: pair.askFieldId,
          values: card.values,
          showTts: pair.showTts,
          askTts: pair.askTts,
          showHints: pair.showHints,
          askHints: pair.askHints,
        });
      }
    }

    // In extra mode, only serve new cards (due cards are already handled by normal sessions)
    // In dueOnly mode, only serve due cards (no new cards or explanations)
    const sessionDueQuestions = isExtra ? [] : dueQuestions;
    const sessionNewQuestions = isDueOnly ? [] : newQuestions;

    // Shuffle within groups, then concatenate: review first, then new
    const shuffledDue = shuffle(sessionDueQuestions);
    const shuffledNew = shuffle(sessionNewQuestions);
    const sessionQuestions = [...shuffledDue, ...shuffledNew];

    // Build a card lookup for distractor selection (quiz mode)
    const isQuizMode = deck.mode === "QUIZ";
    const cardLookup = new Map(allCards.map((c) => [c.id, c]));

    // Format response
    const questions = sessionQuestions.map((q) => {
      // Generate distractors when in quiz mode
      let distractors: string[] | undefined;
      if (isQuizMode) {
        const card = cardLookup.get(q.cardId);
        if (card) {
          distractors = getDistractors(
            { id: card.id, tags: card.tags, values: card.values },
            q.showFieldId,
            q.askFieldId,
            allCards.map((c) => ({ id: c.id, tags: c.tags, values: c.values })),
            deck.quizChoices - 1,
            deck.distractorStrategy as DistractorStrategy
          );
        }
      }

      return {
        cardId: q.cardId,
        showFieldId: q.showFieldId,
        askFieldId: q.askFieldId,
        values: q.values,
        progress: q.progress
          ? {
              stability: q.progress.stability,
              difficulty: q.progress.difficulty,
              state: q.progress.state,
              scheduledDays: q.progress.scheduledDays,
              reps: q.progress.reps,
              lapses: q.progress.lapses,
              elapsedDays: q.progress.elapsedDays,
              learningSteps: q.progress.learningSteps,
              dueDate: q.progress.dueDate,
              lastReviewed: q.progress.lastReviewed,
            }
          : null,
        showTts: q.showTts,
        askTts: q.askTts,
        showHints: q.showHints,
        askHints: q.askHints,
        ...(distractors !== undefined ? { distractors } : {}),
      };
    });

    const sessionExplanations = isDueOnly ? [] : newExplanations;
    const explanations = sessionExplanations.map((e) => ({
      cardId: e.cardId,
      showFieldId: e.showFieldId,
      askFieldId: e.askFieldId,
      values: e.values,
      showTts: e.showTts,
      askTts: e.askTts,
      showHints: e.showHints,
      askHints: e.askHints,
    }));

    // Are there more unseen cards beyond this session?
    const hasMoreNewCards = totalUnseenCards > limitedNewCardIds.size;

    return NextResponse.json({
      deck: {
        id: deck.id,
        name: deck.name,
        fields: deck.fields,
        fieldPairs,
        mode: deck.mode,
        quizChoices: deck.quizChoices,
      },
      questions,
      explanations,
      stats: {
        total: questions.length,
        due: shuffledDue.length,
        new: shuffledNew.length,
        explanations: explanations.length,
        reviewCards: reviewCardIds.size,
        newCards: limitedNewCardIds.size,
      },
      hasMoreNewCards,
    });
  } catch (error) {
    console.error("Error fetching learning session:", error);
    return NextResponse.json(
      { error: "Failed to fetch learning session" },
      { status: 500 }
    );
  }
}
