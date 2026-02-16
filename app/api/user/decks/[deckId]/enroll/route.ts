import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

// POST /api/user/decks/[deckId]/enroll - Enroll in a deck
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ deckId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { deckId } = await params;

    const deck = await prisma.deck.findUnique({ where: { id: deckId } });
    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    await prisma.userDeck.upsert({
      where: {
        userId_deckId: { userId: session.userId, deckId },
      },
      update: {},
      create: { userId: session.userId, deckId },
    });

    return NextResponse.json({ enrolled: true });
  } catch (error) {
    console.error("Error enrolling in deck:", error);
    return NextResponse.json(
      { error: "Failed to enroll in deck" },
      { status: 500 }
    );
  }
}

// DELETE /api/user/decks/[deckId]/enroll - Unenroll from a deck
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ deckId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { deckId } = await params;

    await prisma.userDeck.deleteMany({
      where: { userId: session.userId, deckId },
    });

    return NextResponse.json({ enrolled: false });
  } catch (error) {
    console.error("Error unenrolling from deck:", error);
    return NextResponse.json(
      { error: "Failed to unenroll from deck" },
      { status: 500 }
    );
  }
}
