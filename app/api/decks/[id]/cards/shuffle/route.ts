import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminOrTeacherSession, verifyDeckAccess } from "@/lib/admin-auth";

type RouteParams = {
  params: Promise<{ id: string }>;
};

type ShuffleRequestBody = {
  resetProgressForAllUsers?: boolean;
};

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

    const shuffledCount = await prisma.card.count({
      where: { deckId },
    });

    let progressDeletedCount = 0;

    if (shuffledCount > 1 && resetProgressForAllUsers) {
      const [, deleted] = await prisma.$transaction([
        prisma.$executeRaw`
          WITH shuffled AS (
            SELECT id, row_number() OVER (ORDER BY random()) - 1 AS new_position
            FROM "Card"
            WHERE "deckId" = ${deckId}
          )
          UPDATE "Card" AS c
          SET "position" = shuffled.new_position
          FROM shuffled
          WHERE c.id = shuffled.id
        `,
        prisma.userProgress.deleteMany({
          where: {
            card: { deckId },
          },
        }),
      ]);
      progressDeletedCount = deleted.count;
    } else if (shuffledCount > 1) {
      await prisma.$executeRaw`
        WITH shuffled AS (
          SELECT id, row_number() OVER (ORDER BY random()) - 1 AS new_position
          FROM "Card"
          WHERE "deckId" = ${deckId}
        )
        UPDATE "Card" AS c
        SET "position" = shuffled.new_position
        FROM shuffled
        WHERE c.id = shuffled.id
      `;
    } else if (resetProgressForAllUsers) {
      const deleted = await prisma.userProgress.deleteMany({
        where: {
          card: { deckId },
        },
      });
      progressDeletedCount = deleted.count;
    }

    return NextResponse.json({
      success: true,
      shuffledCount,
      progressDeletedCount,
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
