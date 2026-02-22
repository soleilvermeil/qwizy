import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminOrTeacherSession, canAccess } from "@/lib/admin-auth";
import { getMasteryLevel, getLowestStability } from "@/lib/mastery";

type RouteParams = {
  params: Promise<{ id: string }>;
};

// GET /api/admin/groups/[id]/progress - Get group-level aggregate progress
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const auth = await getAdminOrTeacherSession();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: groupId } = await params;

    const group = await prisma.studentGroup.findUnique({
      where: { id: groupId },
      include: {
        members: {
          select: {
            user: { select: { id: true, username: true } },
          },
        },
        deckAssignments: {
          select: {
            deck: {
              select: {
                id: true,
                name: true,
                questionTypes: { orderBy: { position: "asc" } },
                _count: { select: { cards: true } },
              },
            },
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    if (!canAccess(auth, group.createdById)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const members = group.members.map((m) => m.user);
    const decks = group.deckAssignments.map((a) => a.deck);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // For each deck, compute per-student and aggregate stats
    const deckStats = await Promise.all(
      decks.map(async (deck) => {
        const cards = await prisma.card.findMany({
          where: { deckId: deck.id },
          select: { id: true },
        });
        const totalCards = cards.length;

        const studentStats = await Promise.all(
          members.map(async (member) => {
            const progress = await prisma.userProgress.findMany({
              where: {
                userId: member.id,
                card: { deckId: deck.id },
              },
              select: {
                cardId: true,
                showFieldId: true,
                askFieldId: true,
                stability: true,
                reps: true,
                dueDate: true,
              },
            });

            const progressMap = new Map(
              progress.map((p) => [
                `${p.cardId}:${p.showFieldId}:${p.askFieldId}`,
                p,
              ])
            );

            let notSeen = 0;
            let low = 0;
            let medium = 0;
            let high = 0;

            for (const card of cards) {
              const stabilities = deck.questionTypes.map((qt) => {
                const key = `${card.id}:${qt.showFieldId}:${qt.askFieldId}`;
                const p = progressMap.get(key);
                return p ? p.stability : null;
              });
              const level = getMasteryLevel(getLowestStability(stabilities));
              if (level === "not_seen") notSeen++;
              else if (level === "low") low++;
              else if (level === "medium") medium++;
              else high++;
            }

            const dueCards = progress.filter((p) => {
              const d = new Date(p.dueDate);
              d.setHours(0, 0, 0, 0);
              return d <= today && p.reps > 0;
            }).length;

            const learnedCards = totalCards - notSeen;

            return {
              userId: member.id,
              username: member.username,
              totalCards,
              learnedCards,
              dueCards,
              byMastery: { not_seen: notSeen, low, medium, high },
            };
          })
        );

        // Aggregate
        const started = studentStats.filter((s) => s.learnedCards > 0).length;
        const completed = studentStats.filter(
          (s) => s.learnedCards === totalCards && totalCards > 0
        ).length;
        const avgLearned =
          members.length > 0
            ? Math.round(
                studentStats.reduce((sum, s) => sum + s.learnedCards, 0) /
                  members.length
              )
            : 0;

        return {
          deckId: deck.id,
          deckName: deck.name,
          totalCards,
          totalStudents: members.length,
          studentsStarted: started,
          studentsCompleted: completed,
          avgCardsLearned: avgLearned,
          students: studentStats,
        };
      })
    );

    return NextResponse.json({
      group: {
        id: group.id,
        name: group.name,
      },
      deckStats,
    });
  } catch (error) {
    console.error("Error fetching group progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch group progress" },
      { status: 500 }
    );
  }
}
