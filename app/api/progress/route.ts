import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { calculateNextReview, type Rating } from "@/lib/sm2";

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

    // Get existing progress or use defaults
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

    const currentEF = existingProgress?.easinessFactor || 2.5;
    const currentInterval = existingProgress?.interval || 0;
    const currentRepetitions = existingProgress?.repetitions || 0;

    // Calculate new values using SM-2
    const sm2Result = calculateNextReview(
      rating as Rating,
      currentEF,
      currentInterval,
      currentRepetitions
    );

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
        easinessFactor: sm2Result.easinessFactor,
        interval: sm2Result.interval,
        repetitions: sm2Result.repetitions,
        dueDate: sm2Result.dueDate,
        lastReviewed: new Date(),
      },
      create: {
        userId,
        cardId,
        showFieldId,
        askFieldId,
        easinessFactor: sm2Result.easinessFactor,
        interval: sm2Result.interval,
        repetitions: sm2Result.repetitions,
        dueDate: sm2Result.dueDate,
        lastReviewed: new Date(),
      },
    });

    return NextResponse.json({
      progress: {
        easinessFactor: progress.easinessFactor,
        interval: progress.interval,
        repetitions: progress.repetitions,
        dueDate: progress.dueDate,
      },
      nextReviewIn: sm2Result.interval,
    });
  } catch (error) {
    console.error("Error updating progress:", error);
    return NextResponse.json(
      { error: "Failed to update progress" },
      { status: 500 }
    );
  }
}
