import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { reviewCard, type AppRating, type DBProgress } from "@/lib/fsrs";

// POST /api/progress - Update card progress after review
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.userId;
    const body = await request.json();
    const { cardId, showFieldId, askFieldId, rating } = body;

    // Validate rating
    if (!["failed", "hard", "good", "easy"].includes(rating)) {
      return NextResponse.json(
        { error: "Invalid rating" },
        { status: 400 }
      );
    }

    // Verify card exists
    const card = await prisma.card.findUnique({
      where: { id: cardId },
    });

    if (!card) {
      return NextResponse.json(
        { error: "Card not found" },
        { status: 404 }
      );
    }

    // Get existing progress or null for new card
    const existingProgress = await prisma.userProgress.findUnique({
      where: {
        userId_cardId_showFieldId_askFieldId: {
          userId,
          cardId,
          showFieldId,
          askFieldId,
        },
      },
    });

    const dbProgress: DBProgress | null = existingProgress
      ? {
          stability: existingProgress.stability,
          difficulty: existingProgress.difficulty,
          state: existingProgress.state,
          reps: existingProgress.reps,
          lapses: existingProgress.lapses,
          scheduledDays: existingProgress.scheduledDays,
          elapsedDays: existingProgress.elapsedDays,
          learningSteps: existingProgress.learningSteps,
          dueDate: existingProgress.dueDate,
          lastReviewed: existingProgress.lastReviewed,
        }
      : null;

    // Calculate new values using FSRS
    const result = reviewCard(rating as AppRating, dbProgress);

    // Update or create progress
    const progress = await prisma.userProgress.upsert({
      where: {
        userId_cardId_showFieldId_askFieldId: {
          userId,
          cardId,
          showFieldId,
          askFieldId,
        },
      },
      update: {
        stability: result.stability,
        difficulty: result.difficulty,
        state: result.state,
        reps: result.reps,
        lapses: result.lapses,
        scheduledDays: result.scheduledDays,
        elapsedDays: result.elapsedDays,
        learningSteps: result.learningSteps,
        dueDate: result.dueDate,
        lastReviewed: new Date(),
      },
      create: {
        userId,
        cardId,
        showFieldId,
        askFieldId,
        stability: result.stability,
        difficulty: result.difficulty,
        state: result.state,
        reps: result.reps,
        lapses: result.lapses,
        scheduledDays: result.scheduledDays,
        elapsedDays: result.elapsedDays,
        learningSteps: result.learningSteps,
        dueDate: result.dueDate,
        lastReviewed: new Date(),
      },
    });

    return NextResponse.json({
      progress: {
        stability: progress.stability,
        difficulty: progress.difficulty,
        state: progress.state,
        scheduledDays: progress.scheduledDays,
        reps: progress.reps,
        dueDate: progress.dueDate,
      },
      nextReviewIn: result.scheduledDays,
    });
  } catch (error) {
    console.error("Error updating progress:", error);
    return NextResponse.json(
      { error: "Failed to update progress" },
      { status: 500 }
    );
  }
}
