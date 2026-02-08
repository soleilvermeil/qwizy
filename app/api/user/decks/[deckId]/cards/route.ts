import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { getMasteryLevel, type MasteryLevel } from "@/lib/mastery";

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

    // Verify deck exists
    const deck = await prisma.deck.findUnique({
      where: { id: deckId },
      include: {
        fields: {
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

    // Get user's progress on all cards
    const progress = await prisma.userProgress.findMany({
      where: {
        userId,
        card: { deckId },
      },
      select: {
        cardId: true,
        repetitions: true,
        interval: true,
        easinessFactor: true,
        dueDate: true,
        lastReviewed: true,
      },
    });

    // Create a map of cardId -> progress (aggregate by card)
    const progressByCard = new Map<string, {
      repetitions: number;
      interval: number;
      easinessFactor: number;
      dueDate: Date;
      lastReviewed: Date | null;
    }>();

    for (const p of progress) {
      const existing = progressByCard.get(p.cardId);
      if (!existing || p.repetitions > existing.repetitions) {
        progressByCard.set(p.cardId, {
          repetitions: p.repetitions,
          interval: p.interval,
          easinessFactor: p.easinessFactor,
          dueDate: p.dueDate,
          lastReviewed: p.lastReviewed,
        });
      }
    }

    // Map cards with progress and mastery level
    const cardsWithProgress = cards.map((card) => {
      const cardProgress = progressByCard.get(card.id);
      const mastery = getMasteryLevel(
        cardProgress?.repetitions ?? null,
        cardProgress?.interval ?? null
      );

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
        progress: cardProgress
          ? {
              repetitions: cardProgress.repetitions,
              interval: cardProgress.interval,
              easinessFactor: cardProgress.easinessFactor,
              dueDate: cardProgress.dueDate,
              lastReviewed: cardProgress.lastReviewed,
            }
          : null,
      };
    });

    // Filter by mastery if specified
    const filteredCards = masteryFilter
      ? cardsWithProgress.filter((c) => c.mastery === masteryFilter)
      : cardsWithProgress;

    // Count by mastery level
    const masteryCount: Record<MasteryLevel, number> = {
      not_seen: 0,
      learning: 0,
      review: 0,
      mastered: 0,
    };
    for (const card of cardsWithProgress) {
      masteryCount[card.mastery]++;
    }

    return NextResponse.json({
      deck: {
        id: deck.id,
        name: deck.name,
        fields: deck.fields,
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
