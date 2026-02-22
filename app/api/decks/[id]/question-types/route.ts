import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminOrTeacherSession, verifyDeckAccess } from "@/lib/admin-auth";

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

// POST /api/decks/[id]/question-types - Add a question type (admin or teacher)
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const auth = await getAdminOrTeacherSession();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!(await verifyDeckAccess(auth, id))) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }
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
      showHintFieldIds,
      askHintFieldIds,
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

    // Collect all field IDs that need validation (primary + hints)
    const allFieldIds = new Set([showFieldId, askFieldId]);
    if (Array.isArray(showHintFieldIds)) {
      showHintFieldIds.forEach((fid: string) => allFieldIds.add(fid));
    }
    if (Array.isArray(askHintFieldIds)) {
      askHintFieldIds.forEach((fid: string) => allFieldIds.add(fid));
    }

    // Verify all referenced fields belong to this deck
    const fields = await prisma.field.findMany({
      where: {
        deckId: id,
        id: { in: Array.from(allFieldIds) },
      },
    });

    if (fields.length !== allFieldIds.size) {
      return NextResponse.json(
        { error: "One or more fields do not belong to this deck" },
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
        showHintFieldIds: Array.isArray(showHintFieldIds) && showHintFieldIds.length > 0
          ? showHintFieldIds.join(",") : null,
        askHintFieldIds: Array.isArray(askHintFieldIds) && askHintFieldIds.length > 0
          ? askHintFieldIds.join(",") : null,
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

// PUT /api/decks/[id]/question-types - Update a question type's TTS settings (admin or teacher)
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const auth = await getAdminOrTeacherSession();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!(await verifyDeckAccess(auth, id))) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }
    const body = await request.json();
    const {
      questionTypeId,
      showTtsLang,
      showTtsFieldId,
      showTtsStopAt,
      askTtsLang,
      askTtsFieldId,
      askTtsStopAt,
      showHintFieldIds,
      askHintFieldIds,
    } = body;

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

    // Validate hint field IDs belong to this deck
    const hintFieldIdsToValidate: string[] = [];
    if (Array.isArray(showHintFieldIds)) {
      hintFieldIdsToValidate.push(...showHintFieldIds);
    }
    if (Array.isArray(askHintFieldIds)) {
      hintFieldIdsToValidate.push(...askHintFieldIds);
    }
    if (hintFieldIdsToValidate.length > 0) {
      const uniqueIds = new Set(hintFieldIdsToValidate);
      const validFields = await prisma.field.findMany({
        where: {
          deckId: id,
          id: { in: Array.from(uniqueIds) },
        },
      });
      if (validFields.length !== uniqueIds.size) {
        return NextResponse.json(
          { error: "One or more hint fields do not belong to this deck" },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.deckQuestionType.update({
      where: { id: questionTypeId },
      data: {
        showTtsLang: showTtsLang || null,
        showTtsFieldId: showTtsLang ? (showTtsFieldId || null) : null,
        showTtsStopAt: showTtsLang ? (showTtsStopAt || null) : null,
        askTtsLang: askTtsLang || null,
        askTtsFieldId: askTtsLang ? (askTtsFieldId || null) : null,
        askTtsStopAt: askTtsLang ? (askTtsStopAt || null) : null,
        showHintFieldIds: Array.isArray(showHintFieldIds) && showHintFieldIds.length > 0
          ? showHintFieldIds.join(",") : null,
        askHintFieldIds: Array.isArray(askHintFieldIds) && askHintFieldIds.length > 0
          ? askHintFieldIds.join(",") : null,
      },
    });

    return NextResponse.json({ questionType: updated });
  } catch (error) {
    console.error("Error updating question type:", error);
    return NextResponse.json(
      { error: "Failed to update question type" },
      { status: 500 }
    );
  }
}

// DELETE /api/decks/[id]/question-types - Delete a question type (admin or teacher)
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const auth = await getAdminOrTeacherSession();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!(await verifyDeckAccess(auth, id))) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }
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
