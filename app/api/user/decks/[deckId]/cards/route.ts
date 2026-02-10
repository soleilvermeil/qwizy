import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { getMasteryLevel, getLowestStability, type MasteryLevel } from "@/lib/mastery";

// GET /api/user/decks/[deckId]/cards - Get all cards with user progress
export async function GET(
  request: Request,
  { params }: { params: Promise<{ deckId: string }> }
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

    // Parse query params for filtering
    const url = new URL(request.url);
    const masteryFilter = url.searchParams.get("mastery") as MasteryLevel | null;

    // Verify deck exists and get fields + question types
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

    // Get all cards with their values
    const cards = await prisma.card.findMany({
      where: { deckId },
      include: {
        values: true,
      },
      orderBy: { position: "asc" },
    });

    // Get user's progress on all cards (including field IDs)
    const progress = await prisma.userProgress.findMany({
      where: {
        userId,
        card: { deckId },
      },
      select: {
        cardId: true,
        showFieldId: true,
        askFieldId: true,
        stability: true,
        difficulty: true,
        state: true,
        reps: true,
        lapses: true,
        scheduledDays: true,
        elapsedDays: true,
        learningSteps: true,
        dueDate: true,
        lastReviewed: true,
      },
    });

    // Create a map of "cardId:showFieldId:askFieldId" -> progress
    const progressMap = new Map<string, typeof progress[0]>();
    for (const p of progress) {
      const key = `${p.cardId}:${p.showFieldId}:${p.askFieldId}`;
      progressMap.set(key, p);
    }

    // Build a field name lookup
    const fieldNameMap = new Map<string, string>();
    for (const f of deck.fields) {
      fieldNameMap.set(f.id, f.name);
    }

    // Map cards with per-question-type progress and mastery level
    const cardsWithProgress = cards.map((card) => {
      // Build per-question-type progress array
      const questionTypeProgress = deck.questionTypes.map((qt) => {
        const key = `${card.id}:${qt.showFieldId}:${qt.askFieldId}`;
        const p = progressMap.get(key);

        return {
          showFieldId: qt.showFieldId,
          askFieldId: qt.askFieldId,
          showFieldName: fieldNameMap.get(qt.showFieldId) || qt.showFieldId,
          askFieldName: fieldNameMap.get(qt.askFieldId) || qt.askFieldId,
          useAsQuestion: qt.useAsQuestion,
          useAsExplanation: qt.useAsExplanation,
          progress: p
            ? {
                stability: p.stability,
                difficulty: p.difficulty,
                state: p.state,
                reps: p.reps,
                lapses: p.lapses,
                scheduledDays: p.scheduledDays,
                elapsedDays: p.elapsedDays,
                learningSteps: p.learningSteps,
                dueDate: p.dueDate,
                lastReviewed: p.lastReviewed,
              }
            : null,
        };
      });

      // Compute mastery from the lowest stability across question types only
      // (explanation-only types have no FSRS progress and should not affect mastery)
      const stabilities = questionTypeProgress
        .filter((qt) => qt.useAsQuestion)
        .map((qt) => qt.progress?.stability ?? null);
      const lowestStability = getLowestStability(stabilities);
      const mastery = getMasteryLevel(lowestStability);

      // Create a map of fieldId -> value for easy lookup
      const valuesByField: Record<string, string> = {};
      for (const v of card.values) {
        valuesByField[v.fieldId] = v.value;
      }

      return {
        id: card.id,
        position: card.position,
        values: valuesByField,
        mastery,
        questionTypeProgress,
      };
    });

    // Filter by mastery if specified
    const filteredCards = masteryFilter
      ? cardsWithProgress.filter((c) => c.mastery === masteryFilter)
      : cardsWithProgress;

    // Count by mastery level
    const masteryCount: Record<MasteryLevel, number> = {
      not_seen: 0,
      low: 0,
      medium: 0,
      high: 0,
    };
    for (const card of cardsWithProgress) {
      masteryCount[card.mastery]++;
    }

    return NextResponse.json({
      deck: {
        id: deck.id,
        name: deck.name,
        fields: deck.fields,
        questionTypes: deck.questionTypes.map((qt) => ({
          id: qt.id,
          showFieldId: qt.showFieldId,
          askFieldId: qt.askFieldId,
          position: qt.position,
        })),
      },
      cards: filteredCards,
      counts: masteryCount,
      total: cardsWithProgress.length,
    });
  } catch (error) {
    console.error("Error fetching user cards:", error);
    return NextResponse.json(
      { error: "Failed to fetch cards" },
      { status: 500 }
    );
  }
}
