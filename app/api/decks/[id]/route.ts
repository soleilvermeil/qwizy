import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

type RouteParams = {
  params: Promise<{ id: string }>;
};

// GET /api/decks/[id] - Get a specific deck
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    
    const deck = await prisma.deck.findUnique({
      where: { id },
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
        groupAssignments: {
          select: {
            mandatory: true,
            group: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!deck) {
      return NextResponse.json(
        { error: "Deck not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ deck });
  } catch (error) {
    console.error("Error fetching deck:", error);
    return NextResponse.json(
      { error: "Failed to fetch deck" },
      { status: 500 }
    );
  }
}

// PUT /api/decks/[id] - Update a deck (admin only)
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

    const { id } = await params;
    const body = await request.json();
    const { name, description, fields, visibility, mode, quizChoices, distractorStrategy } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Deck name is required" },
        { status: 400 }
      );
    }

    // Update deck and fields in a transaction
    const deck = await prisma.$transaction(async (tx) => {
      // Update deck basic info
      const deckData: Record<string, unknown> = {
        name: name.trim(),
        description: description?.trim() || null,
      };
      if (visibility === "PUBLIC" || visibility === "EDUCATION_ONLY") {
        deckData.visibility = visibility;
      }
      if (mode === "NORMAL" || mode === "QUIZ") {
        deckData.mode = mode;
      }
      if (typeof quizChoices === "number" && quizChoices >= 2 && quizChoices <= 10) {
        deckData.quizChoices = quizChoices;
      }
      if (distractorStrategy === "TAGS" || distractorStrategy === "LEVENSHTEIN_ANSWER" || distractorStrategy === "LEVENSHTEIN_QUESTION") {
        deckData.distractorStrategy = distractorStrategy;
      }

      await tx.deck.update({
        where: { id },
        data: deckData,
      });

      // If fields are provided, update them
      if (fields && Array.isArray(fields)) {
        // Get existing fields
        const existingFields = await tx.field.findMany({
          where: { deckId: id },
        });

        const existingIds = new Set(existingFields.map((f) => f.id));
        const newFieldIds = new Set(
          fields.filter((f: { id?: string }) => f.id).map((f: { id: string }) => f.id)
        );

        // Delete fields that are no longer in the list
        const toDelete = existingFields.filter((f) => !newFieldIds.has(f.id));
        for (const field of toDelete) {
          // Delete associated card values first
          await tx.cardValue.deleteMany({
            where: { fieldId: field.id },
          });
          await tx.field.delete({
            where: { id: field.id },
          });
        }

        // Update or create fields
        for (let i = 0; i < fields.length; i++) {
          const field = fields[i];
          if (field.id && existingIds.has(field.id)) {
            // Update existing field
            await tx.field.update({
              where: { id: field.id },
              data: {
                name: field.name.trim(),
                position: i,
              },
            });
          } else {
            // Create new field
            await tx.field.create({
              data: {
                deckId: id,
                name: field.name.trim(),
                position: i,
              },
            });
          }
        }
      }

      // Return updated deck
      return tx.deck.findUnique({
        where: { id },
        include: {
          fields: {
            orderBy: { position: "asc" },
          },
        },
      });
    });

    return NextResponse.json({ deck });
  } catch (error) {
    console.error("Error updating deck:", error);
    return NextResponse.json(
      { error: "Failed to update deck" },
      { status: 500 }
    );
  }
}

// DELETE /api/decks/[id] - Delete a deck (admin only)
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

    const { id } = await params;

    await prisma.deck.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting deck:", error);
    return NextResponse.json(
      { error: "Failed to delete deck" },
      { status: 500 }
    );
  }
}
