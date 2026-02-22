import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

// GET /api/user/data-export - Export all user personal data (GDPR Art. 15 & 20)
export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.userId;

    // Fetch user account data (excluding password hash)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        isAdmin: true,
        newCardsPerDay: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch all learning progress with card and deck details
    const progress = await prisma.userProgress.findMany({
      where: { userId },
      select: {
        id: true,
        stability: true,
        difficulty: true,
        state: true,
        reps: true,
        lapses: true,
        scheduledDays: true,
        dueDate: true,
        lastReviewed: true,
        createdAt: true,
        card: {
          select: {
            id: true,
            tags: true,
            values: {
              select: {
                value: true,
                field: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            deck: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        showFieldId: true,
        askFieldId: true,
      },
    });

    // Build the export object
    const exportData = {
      exportDate: new Date().toISOString(),
      account: {
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin,
        newCardsPerDay: user.newCardsPerDay,
        createdAt: user.createdAt.toISOString(),
      },
      learningProgress: progress.map((p) => ({
        id: p.id,
        deck: p.card.deck.name,
        card: Object.fromEntries(
          p.card.values.map((v) => [v.field.name, v.value])
        ),
        cardTags: p.card.tags || undefined,
        showFieldId: p.showFieldId,
        askFieldId: p.askFieldId,
        stability: p.stability,
        difficulty: p.difficulty,
        state: p.state,
        reps: p.reps,
        lapses: p.lapses,
        scheduledDays: p.scheduledDays,
        dueDate: p.dueDate.toISOString(),
        lastReviewed: p.lastReviewed?.toISOString() ?? null,
        createdAt: p.createdAt.toISOString(),
      })),
    };

    // Return as a downloadable JSON file
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="qwizy-data-${user.username}-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (error) {
    console.error("Error exporting user data:", error);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    );
  }
}
