import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { getMasteryLevel, getLowestStability, type MasteryLevel } from "@/lib/mastery";
import { getNewCardsIntroducedToday } from "@/lib/daily";

// GET /api/user/decks/[deckId]/stats - Get detailed stats for a deck
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

    // Verify deck exists
    const deck = await prisma.deck.findUnique({
      where: { id: deckId },
      include: {
        fields: {
          orderBy: { position: "asc" },
        },
        questionTypes: {
          orderBy: { position: "asc" },
        },
        _count: {
          select: { cards: true },
        },
      },
    });

    if (!deck) {
      return NextResponse.json(
        { error: "Deck not found" },
        { status: 404 }
      );
    }

    // Get all cards in the deck
    const cards = await prisma.card.findMany({
      where: { deckId },
      select: { id: true },
    });

    // Get user's progress on all cards in this deck
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
        scheduledDays: true,
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

    // Calculate mastery levels using lowest stability across question types
    const masteryCount: Record<MasteryLevel, number> = {
      not_seen: 0,
      low: 0,
      medium: 0,
      high: 0,
    };

    let totalDifficulty = 0;
    let difficultyCount = 0;
    let totalReviews = 0;
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Map cardId -> mastery level (for upcoming breakdown)
    const cardMasteryMap = new Map<string, MasteryLevel>();

    for (const card of cards) {
      // Gather stabilities for all question types for this card
      const stabilities = deck.questionTypes.map((qt) => {
        const key = `${card.id}:${qt.showFieldId}:${qt.askFieldId}`;
        const p = progressMap.get(key);
        return p ? p.stability : null;
      });

      const lowestStability = getLowestStability(stabilities);
      const level = getMasteryLevel(lowestStability);
      masteryCount[level]++;
      cardMasteryMap.set(card.id, level);

      // Accumulate stats from all progress entries for this card
      for (const qt of deck.questionTypes) {
        const key = `${card.id}:${qt.showFieldId}:${qt.askFieldId}`;
        const p = progressMap.get(key);
        if (p) {
          totalDifficulty += p.difficulty;
          difficultyCount++;
          totalReviews += p.reps;
        }
      }
    }

    // Count due today
    const dueToday = progress.filter(p => {
      const dueDate = new Date(p.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate <= now && p.reps > 0;
    }).length;

    // Get user's daily new card limit
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { newCardsPerDay: true },
    });

    // Calculate new cards available (respecting daily limit minus already introduced today)
    const newCardsPerDay = user?.newCardsPerDay || 10;
    const alreadyIntroducedToday = await getNewCardsIntroducedToday(userId, deckId);
    const remainingDailyNew = Math.max(0, newCardsPerDay - alreadyIntroducedToday);
    const newAvailable = Math.min(masteryCount.not_seen, remainingDailyNew);

    // Calculate upcoming reviews for next 7 days, broken down by stability level
    const upcomingByLevel: { newCards: number; low: number; medium: number; high: number }[] =
      Array.from({ length: 7 }, () => ({ newCards: 0, low: 0, medium: 0, high: 0 }));

    for (const p of progress) {
      if (p.reps === 0) continue;
      const dueDate = new Date(p.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 0 || diffDays >= 7) continue;

      const cardLevel = cardMasteryMap.get(p.cardId) ?? "low";
      if (cardLevel === "low") upcomingByLevel[diffDays].low++;
      else if (cardLevel === "medium") upcomingByLevel[diffDays].medium++;
      else if (cardLevel === "high") upcomingByLevel[diffDays].high++;
      // not_seen cards won't have reps > 0, so no branch needed
    }

    // Forecast new cards per day for next 7 days
    let remainingNew = masteryCount.not_seen;
    for (let day = 0; day < 7; day++) {
      const limit = day === 0 ? remainingDailyNew : newCardsPerDay;
      const newForDay = Math.min(remainingNew, limit);
      upcomingByLevel[day].newCards = newForDay;
      remainingNew -= newForDay;
    }

    const upcoming = upcomingByLevel;

    // Calculate average difficulty (FSRS difficulty is 1-10)
    const averageDifficulty = difficultyCount > 0 ? totalDifficulty / difficultyCount : 0;

    return NextResponse.json({
      deck: {
        id: deck.id,
        name: deck.name,
        description: deck.description,
        fields: deck.fields,
      },
      stats: {
        total: cards.length,
        learned: cards.length - masteryCount.not_seen,
        dueToday,
        newAvailable,
        byMastery: masteryCount,
        upcoming,
        averageDifficulty: Math.round(averageDifficulty * 100) / 100,
        totalReviews,
      },
    });
  } catch (error) {
    console.error("Error fetching deck stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch deck stats" },
      { status: 500 }
    );
  }
}
