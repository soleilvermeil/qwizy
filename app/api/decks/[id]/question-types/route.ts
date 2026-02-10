import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

type RouteParams = {
  params: Promise<{ id: string }>;
};

// GET /api/decks/[id]/question-types - Get question types for a deck
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    const questionTypes = await prisma.deckQuestionType.findMany({
      where: { deckId: id },
      orderBy: { position: "asc" },
    });

    return NextResponse.json({ questionTypes });
  } catch (error) {
    console.error("Error fetching question types:", error);
    return NextResponse.json(
      { error: "Failed to fetch question types" },
      { status: 500 }
    );
  }
}

// POST /api/decks/[id]/question-types - Add a question type (admin only)
export async function POST(
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
    const {
      showFieldId,
      askFieldId,
      useAsQuestion,
      useAsExplanation,
      showTtsLang,
      showTtsFieldId,
      showTtsStopAt,
      askTtsLang,
      askTtsFieldId,
      askTtsStopAt,
    } = body;

    if (!showFieldId || !askFieldId) {
      return NextResponse.json(
        { error: "showFieldId and askFieldId are required" },
        { status: 400 }
      );
    }

    if (showFieldId === askFieldId) {
      return NextResponse.json(
        { error: "Show and ask fields must be different" },
        { status: 400 }
      );
    }

    // Verify the fields belong to this deck
    const fields = await prisma.field.findMany({
      where: {
        deckId: id,
        id: { in: [showFieldId, askFieldId] },
      },
    });

    if (fields.length !== 2) {
      return NextResponse.json(
        { error: "One or both fields do not belong to this deck" },
        { status: 400 }
      );
    }

    // Check for duplicate
    const existing = await prisma.deckQuestionType.findUnique({
      where: {
        deckId_showFieldId_askFieldId: {
          deckId: id,
          showFieldId,
          askFieldId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "This question type already exists" },
        { status: 409 }
      );
    }

    // Get the next position
    const maxPosition = await prisma.deckQuestionType.findFirst({
      where: { deckId: id },
      orderBy: { position: "desc" },
      select: { position: true },
    });

    const questionType = await prisma.deckQuestionType.create({
      data: {
        deckId: id,
        showFieldId,
        askFieldId,
        position: (maxPosition?.position ?? -1) + 1,
        useAsQuestion: useAsQuestion ?? true,
        useAsExplanation: useAsExplanation ?? false,
        showTtsLang: showTtsLang || null,
        showTtsFieldId: showTtsLang ? (showTtsFieldId || null) : null,
        showTtsStopAt: showTtsLang ? (showTtsStopAt || null) : null,
        askTtsLang: askTtsLang || null,
        askTtsFieldId: askTtsLang ? (askTtsFieldId || null) : null,
        askTtsStopAt: askTtsLang ? (askTtsStopAt || null) : null,
      },
    });

    return NextResponse.json({ questionType }, { status: 201 });
  } catch (error) {
    console.error("Error creating question type:", error);
    return NextResponse.json(
      { error: "Failed to create question type" },
      { status: 500 }
    );
  }
}

// DELETE /api/decks/[id]/question-types - Delete a question type (admin only)
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
    const { searchParams } = new URL(request.url);
    const questionTypeId = searchParams.get("questionTypeId");

    if (!questionTypeId) {
      return NextResponse.json(
        { error: "questionTypeId is required" },
        { status: 400 }
      );
    }

    // Verify question type belongs to this deck
    const questionType = await prisma.deckQuestionType.findFirst({
      where: {
        id: questionTypeId,
        deckId: id,
      },
    });

    if (!questionType) {
      return NextResponse.json(
        { error: "Question type not found" },
        { status: 404 }
      );
    }

    await prisma.deckQuestionType.delete({
      where: { id: questionTypeId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting question type:", error);
    return NextResponse.json(
      { error: "Failed to delete question type" },
      { status: 500 }
    );
  }
}
