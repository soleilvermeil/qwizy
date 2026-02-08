import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

// DELETE /api/user/decks/[deckId]/progress - Reset all user progress for a deck
export async function DELETE(
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
      select: { id: true, name: true },
    });

    if (!deck) {
      return NextResponse.json(
        { error: "Deck not found" },
        { status: 404 }
      );
    }

    // Get all card IDs in this deck
    const cards = await prisma.card.findMany({
      where: { deckId },
      select: { id: true },
    });

    const cardIds = cards.map((c) => c.id);

    // Delete in batches to avoid SQLite parameter limit
    const BATCH_SIZE = 500;
    let totalDeleted = 0;

    for (let i = 0; i < cardIds.length; i += BATCH_SIZE) {
      const batch = cardIds.slice(i, i + BATCH_SIZE);
      const result = await prisma.userProgress.deleteMany({
        where: {
          userId,
          cardId: { in: batch },
        },
      });
      totalDeleted += result.count;
    }

    return NextResponse.json({
      message: "Progress reset successfully",
      deletedCount: totalDeleted,
    });
  } catch (error) {
    console.error("Error resetting progress:", error);
    return NextResponse.json(
      { error: "Failed to reset progress" },
      { status: 500 }
    );
  }
}
