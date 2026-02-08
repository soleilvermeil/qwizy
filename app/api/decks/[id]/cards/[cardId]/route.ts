import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

type RouteParams = {
  params: Promise<{ id: string; cardId: string }>;
};

// GET /api/decks/[id]/cards/[cardId] - Get a specific card
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id, cardId } = await params;

    const card = await prisma.card.findFirst({
      where: {
        id: cardId,
        deckId: id,
      },
      include: {
        values: true,
      },
    });

    if (!card) {
      return NextResponse.json(
        { error: "Card not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ card });
  } catch (error) {
    console.error("Error fetching card:", error);
    return NextResponse.json(
      { error: "Failed to fetch card" },
      { status: 500 }
    );
  }
}

// PUT /api/decks/[id]/cards/[cardId] - Update a card (admin only)
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getSession();

    if (!session || !session.isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id, cardId } = await params;
    const body = await request.json();
    const { values } = body;

    // Verify card exists
    const existingCard = await prisma.card.findFirst({
      where: {
        id: cardId,
        deckId: id,
      },
    });

    if (!existingCard) {
      return NextResponse.json(
        { error: "Card not found" },
        { status: 404 }
      );
    }

    // Update card values in a transaction
    const card = await prisma.$transaction(async (tx) => {
      // Delete existing values
      await tx.cardValue.deleteMany({
        where: { cardId },
      });

      // Create new values
      await tx.cardValue.createMany({
        data: values
          .filter((v: { fieldId: string; value: string }) => v.value.trim() !== "")
          .map((v: { fieldId: string; value: string }) => ({
            cardId,
            fieldId: v.fieldId,
            value: v.value.trim(),
          })),
      });

      return tx.card.findUnique({
        where: { id: cardId },
        include: { values: true },
      });
    });

    return NextResponse.json({ card });
  } catch (error) {
    console.error("Error updating card:", error);
    return NextResponse.json(
      { error: "Failed to update card" },
      { status: 500 }
    );
  }
}

// DELETE /api/decks/[id]/cards/[cardId] - Delete a card (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getSession();

    if (!session || !session.isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id, cardId } = await params;

    // Verify card exists
    const card = await prisma.card.findFirst({
      where: {
        id: cardId,
        deckId: id,
      },
    });

    if (!card) {
      return NextResponse.json(
        { error: "Card not found" },
        { status: 404 }
      );
    }

    await prisma.card.delete({
      where: { id: cardId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting card:", error);
    return NextResponse.json(
      { error: "Failed to delete card" },
      { status: 500 }
    );
  }
}
