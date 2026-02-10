import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { getNewCardsIntroducedToday } from "@/lib/daily";

type RouteParams = {
  params: Promise<{ deckId: string }>;
};

interface TtsConfig {
  lang: string;
  fieldId: string;
  stopAt: string | null;
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
    const now = new Date();
    now.setHours(0, 0, 0, 0);

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
    interface FieldPair {
      showFieldId: string;
      askFieldId: string;
      showTts: TtsConfig | null;
      askTts: TtsConfig | null;
    }

    let fieldPairs: FieldPair[];

    if (deck.questionTypes.length > 0) {
      fieldPairs = deck.questionTypes.map((qt) => ({
        showFieldId: qt.showFieldId,
        askFieldId: qt.askFieldId,
        showTts: qt.showTtsLang && qt.showTtsFieldId
          ? { lang: qt.showTtsLang, fieldId: qt.showTtsFieldId, stopAt: qt.showTtsStopAt }
          : null,
        askTts: qt.askTtsLang && qt.askTtsFieldId
          ? { lang: qt.askTtsLang, fieldId: qt.askTtsFieldId, stopAt: qt.askTtsStopAt }
          : null,
      }));
    } else {
      if (deck.fields.length < 2) {
        return NextResponse.json(
          { error: "Deck must have at least 2 fields" },
          { status: 400 }
        );
      }
      fieldPairs = [
        {
          showFieldId: deck.fields[0].id,
          askFieldId: deck.fields[1].id,
          showTts: null,
          askTts: null,
        },
      ];
    }

    // Get user settings
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { newCardsPerDay: true },
    });

    const newCardsPerDay = user?.newCardsPerDay || 10;

    // Check if this is an "extra study" request (beyond daily limit)
    const isExtra = request.nextUrl.searchParams.get("extra") === "true";

    // Get all cards in deck with their values
    const allCards = await prisma.card.findMany({
      where: { deckId },
      include: {
        values: true,
      },
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
    const dueQuestions: QuestionItem[] = [];
    const newCardIds: string[] = [];
    const reviewCardIds = new Set<string>();

    for (const card of allCards) {
      let hasAnyProgress = false;

      for (const pair of fieldPairs) {
        const key = `${card.id}:${pair.showFieldId}:${pair.askFieldId}`;
        const progress = progressMap.get(key);

        if (progress) {
          hasAnyProgress = true;
          // Check if this question is due
          if (new Date(progress.dueDate) <= now) {
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
            });
            reviewCardIds.add(card.id);
          }
        }
      }

      if (!hasAnyProgress) {
        newCardIds.push(card.id);
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

    // Generate questions for new cards (all field pairs for each new card)
    const newQuestions: QuestionItem[] = [];
    for (const card of allCards) {
      if (!limitedNewCardIds.has(card.id)) continue;

      for (const pair of fieldPairs) {
        newQuestions.push({
          cardId: card.id,
          showFieldId: pair.showFieldId,
          askFieldId: pair.askFieldId,
          values: card.values,
          progress: null,
          showTts: pair.showTts,
          askTts: pair.askTts,
        });
      }
    }

    // In extra mode, only serve new cards (due cards are already handled by normal sessions)
    const sessionDueQuestions = isExtra ? [] : dueQuestions;

    // Shuffle within groups, then concatenate: review first, then new
    const shuffledDue = shuffle(sessionDueQuestions);
    const shuffledNew = shuffle(newQuestions);
    const sessionQuestions = [...shuffledDue, ...shuffledNew];

    // Format response
    const questions = sessionQuestions.map((q) => ({
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
    }));

    // Are there more unseen cards beyond this session?
    const hasMoreNewCards = totalUnseenCards > limitedNewCardIds.size;

    return NextResponse.json({
      deck: {
        id: deck.id,
        name: deck.name,
        fields: deck.fields,
        fieldPairs,
      },
      questions,
      stats: {
        total: questions.length,
        due: shuffledDue.length,
        new: shuffledNew.length,
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
