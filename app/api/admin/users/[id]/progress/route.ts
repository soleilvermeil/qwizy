import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminOrTeacherSession, canAccess } from "@/lib/admin-auth";
import { getMasteryLevel, getLowestStability, type MasteryLevel } from "@/lib/mastery";

type RouteParams = {
  params: Promise<{ id: string }>;
};

// GET /api/admin/users/[id]/progress - Get student's per-deck progress
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const auth = await getAdminOrTeacherSession();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: userId } = await params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, createdById: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!canAccess(auth, user.createdById)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all decks the user is enrolled in
    const enrollments = await prisma.userDeck.findMany({
      where: { userId },
      select: {
        deck: {
          select: {
            id: true,
            name: true,
            questionTypes: { orderBy: { position: "asc" } },
            _count: { select: { cards: true } },
          },
        },
      },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deckProgress = await Promise.all(
      enrollments.map(async ({ deck }) => {
        const cards = await prisma.card.findMany({
          where: { deckId: deck.id },
          select: { id: true },
        });

        const progress = await prisma.userProgress.findMany({
          where: {
            userId,
            card: { deckId: deck.id },
          },
          select: {
            cardId: true,
            showFieldId: true,
            askFieldId: true,
            stability: true,
            difficulty: true,
            state: true,
            reps: true,
            dueDate: true,
          },
        });

        const progressMap = new Map(
          progress.map((p) => [`${p.cardId}:${p.showFieldId}:${p.askFieldId}`, p])
        );

        // Calculate mastery breakdown
        const masteryCount: Record<MasteryLevel, number> = {
          not_seen: 0,
          low: 0,
          medium: 0,
          high: 0,
        };

        let totalDifficulty = 0;
        let difficultyCount = 0;
        let totalReviews = 0;

        for (const card of cards) {
          const stabilities = deck.questionTypes.map((qt) => {
            const key = `${card.id}:${qt.showFieldId}:${qt.askFieldId}`;
            const p = progressMap.get(key);
            return p ? p.stability : null;
          });

          const lowestStability = getLowestStability(stabilities);
          const level = getMasteryLevel(lowestStability);
          masteryCount[level]++;

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

        // Count due cards
        const dueCards = progress.filter((p) => {
          const d = new Date(p.dueDate);
          d.setHours(0, 0, 0, 0);
          return d <= today && p.reps > 0;
        }).length;

        return {
          deckId: deck.id,
          deckName: deck.name,
          totalCards: cards.length,
          learnedCards: cards.length - masteryCount.not_seen,
          dueCards,
          byMastery: masteryCount,
          averageDifficulty: difficultyCount > 0
            ? Math.round((totalDifficulty / difficultyCount) * 100) / 100
            : 0,
          totalReviews,
        };
      })
    );

    return NextResponse.json({
      user: { id: user.id, username: user.username },
      deckProgress,
    });
  } catch (error) {
    console.error("Error fetching user progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch user progress" },
      { status: 500 }
    );
  }
}
