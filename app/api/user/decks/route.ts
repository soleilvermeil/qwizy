import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { getNewCardsIntroducedToday } from "@/lib/daily";

// GET /api/user/decks - List all decks with user progress
export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.userId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get enrolled decks with card counts
    const decks = await prisma.deck.findMany({
      where: {
        enrollments: { some: { userId } },
      },
      include: {
        fields: {
          orderBy: { position: "asc" },
        },
        _count: {
          select: { cards: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get user progress for each deck
    const decksWithProgress = await Promise.all(
      decks.map(async (deck) => {
        // Get total cards in deck
        const totalCards = deck._count.cards;

        // Get user's progress on this deck
        const progress = await prisma.userProgress.findMany({
          where: {
            userId,
            card: { deckId: deck.id },
          },
          select: {
            cardId: true,
            dueDate: true,
            reps: true,
            state: true,
          },
        });

        // Count unique cards the user has started learning
        const learnedCardIds = new Set(progress.map((p) => p.cardId));
        const learnedCards = learnedCardIds.size;

        // Count cards that are due today or earlier (calendar-day granularity)
        // state 2 = Review (normal scheduled reviews)
        // state 0,1,3 = New/Learning/Relearning (0-day interval cards)
        const dueProgress = progress.filter((p) => {
          const d = new Date(p.dueDate);
          d.setHours(0, 0, 0, 0);
          return d <= today && p.reps > 0;
        });
        const dueCards = dueProgress.length;
        const dueReviews = dueProgress.filter((p) => p.state === 2).length;
        const dueLearning = dueProgress.filter((p) => p.state !== 2).length;

        // Get user's daily new card limit
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { newCardsPerDay: true },
        });

        // Count how many new cards are available
        const cardIdsWithProgress = new Set(progress.map((p) => p.cardId));
        const allCardIds = await prisma.card.findMany({
          where: { deckId: deck.id },
          select: { id: true },
        });
        const newCardsAvailable = allCardIds.filter(
          (c) => !cardIdsWithProgress.has(c.id)
        ).length;

        // Account for new cards already introduced today
        const newCardsPerDay = user?.newCardsPerDay || 10;
        const alreadyIntroducedToday = await getNewCardsIntroducedToday(userId, deck.id);
        const remainingDailyNew = Math.max(0, newCardsPerDay - alreadyIntroducedToday);
        const newCards = Math.min(newCardsAvailable, remainingDailyNew);

        return {
          ...deck,
          progress: {
            totalCards,
            learnedCards,
            dueCards,
            dueReviews,
            dueLearning,
            newCards,
            hasMoreNewCards: newCardsAvailable > newCards,
          },
        };
      })
    );

    return NextResponse.json({ decks: decksWithProgress });
  } catch (error) {
    console.error("Error fetching user decks:", error);
    return NextResponse.json(
      { error: "Failed to fetch decks" },
      { status: 500 }
    );
  }
}
