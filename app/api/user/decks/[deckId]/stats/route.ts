import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { getMasteryLevel, getUpcomingReviews, type MasteryLevel } from "@/lib/mastery";
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
        repetitions: true,
        interval: true,
        easinessFactor: true,
        dueDate: true,
        lastReviewed: true,
      },
    });

    // Create a map of cardId -> progress (using first progress entry for each card)
    const progressByCard = new Map<string, typeof progress[0]>();
    for (const p of progress) {
      if (!progressByCard.has(p.cardId)) {
        progressByCard.set(p.cardId, p);
      }
    }

    // Calculate mastery levels
    const masteryCount: Record<MasteryLevel, number> = {
      not_seen: 0,
      learning: 0,
      review: 0,
      mastered: 0,
    };

    let totalEF = 0;
    let efCount = 0;
    let totalReviews = 0;
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    for (const card of cards) {
      const p = progressByCard.get(card.id);
      
      if (!p) {
        masteryCount.not_seen++;
      } else {
        const level = getMasteryLevel(p.repetitions, p.interval);
        masteryCount[level]++;
        
        totalEF += p.easinessFactor;
        efCount++;
        totalReviews += p.repetitions;
      }
    }

    // Count due today
    const dueToday = progress.filter(p => {
      const dueDate = new Date(p.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate <= now && p.repetitions > 0;
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

    // Calculate upcoming reviews for next 7 days
    const upcomingReviews = getUpcomingReviews(
      progress.filter(p => p.repetitions > 0),
      7,
      (p) => p.dueDate
    );

    // Forecast new cards per day for next 7 days
    let remainingNew = masteryCount.not_seen;
    const upcomingNew = new Array(7).fill(0);
    for (let day = 0; day < 7; day++) {
      // Day 0 (today): account for cards already introduced today
      const limit = day === 0 ? remainingDailyNew : newCardsPerDay;
      const newForDay = Math.min(remainingNew, limit);
      upcomingNew[day] = newForDay;
      remainingNew -= newForDay;
    }

    // Combine into a structured upcoming array
    const upcoming = upcomingReviews.map((reviews, i) => ({
      reviews,
      newCards: upcomingNew[i],
    }));

    // Calculate average easiness factor
    const averageEF = efCount > 0 ? totalEF / efCount : 2.5;

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
        averageEF: Math.round(averageEF * 100) / 100,
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
