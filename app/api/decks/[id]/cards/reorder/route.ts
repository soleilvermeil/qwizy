import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminOrTeacherSession, verifyDeckAccess } from "@/lib/admin-auth";

type RouteParams = {
  params: Promise<{ id: string }>;
};

// PUT /api/decks/[id]/cards/reorder - Reorder cards (admin or teacher)
export async function PUT(
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
    const body = await request.json();
    const { cardId, direction } = body;

    if (!cardId || !["up", "down"].includes(direction)) {
      return NextResponse.json(
        { error: "Invalid request: cardId and direction (up/down) required" },
        { status: 400 }
      );
    }

    // Verify deck exists
    const deck = await prisma.deck.findUnique({
      where: { id: deckId },
    });

    if (!deck) {
      return NextResponse.json(
        { error: "Deck not found" },
        { status: 404 }
      );
    }

    // Get the card to move
    const card = await prisma.card.findFirst({
      where: { id: cardId, deckId },
    });

    if (!card) {
      return NextResponse.json(
        { error: "Card not found in this deck" },
        { status: 404 }
      );
    }

    // Find the adjacent card to swap with
    const adjacentCard = await prisma.card.findFirst({
      where: {
        deckId,
        position: direction === "up" 
          ? { lt: card.position }
          : { gt: card.position },
      },
      orderBy: {
        position: direction === "up" ? "desc" : "asc",
      },
    });

    if (!adjacentCard) {
      // Card is already at the boundary
      return NextResponse.json({ 
        success: true, 
        message: `Card is already at the ${direction === "up" ? "top" : "bottom"}` 
      });
    }

    // Swap positions
    await prisma.$transaction([
      prisma.card.update({
        where: { id: card.id },
        data: { position: adjacentCard.position },
      }),
      prisma.card.update({
        where: { id: adjacentCard.id },
        data: { position: card.position },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering cards:", error);
    return NextResponse.json(
      { error: "Failed to reorder cards" },
      { status: 500 }
    );
  }
}
