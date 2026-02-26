import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminOrTeacherSession, verifyDeckAccess } from "@/lib/admin-auth";

type RouteParams = {
  params: Promise<{ id: string }>;
};

type ShuffleRequestBody = {
  resetProgressForAllUsers?: boolean;
};

function shuffleCardIds(cardIds: string[]): string[] {
  const shuffled = [...cardIds];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// POST /api/decks/[id]/cards/shuffle - Shuffle deck cards and optionally reset progress
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const auth = await getAdminOrTeacherSession();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: deckId } = await params;
    if (!(await verifyDeckAccess(auth, deckId))) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    const body = (await request.json().catch(() => ({}))) as ShuffleRequestBody;
    const { resetProgressForAllUsers = false } = body;

    if (typeof resetProgressForAllUsers !== "boolean") {
      return NextResponse.json(
        { error: "Invalid request: resetProgressForAllUsers must be a boolean" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const cards = await tx.card.findMany({
        where: { deckId },
        select: { id: true },
        orderBy: { position: "asc" },
      });

      if (cards.length > 1) {
        const shuffledCardIds = shuffleCardIds(cards.map((card) => card.id));
        await Promise.all(
          shuffledCardIds.map((cardId, position) =>
            tx.card.update({
              where: { id: cardId },
              data: { position },
            })
          )
        );
      }

      let progressDeletedCount = 0;
      if (resetProgressForAllUsers) {
        const deleted = await tx.userProgress.deleteMany({
          where: {
            card: { deckId },
          },
        });
        progressDeletedCount = deleted.count;
      }

      return {
        shuffledCount: cards.length,
        progressDeletedCount,
      };
    });

    return NextResponse.json({
      success: true,
      shuffledCount: result.shuffledCount,
      progressDeletedCount: result.progressDeletedCount,
      resetProgressForAllUsers,
    });
  } catch (error) {
    console.error("Error shuffling cards:", error);
    return NextResponse.json(
      { error: "Failed to shuffle cards" },
      { status: 500 }
    );
  }
}
