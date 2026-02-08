import { prisma } from "@/lib/db";

/**
 * Count how many new cards were introduced today for a specific deck.
 * A "new card" is one whose UserProgress was created today (first time seen).
 * Returns the count of distinct cardIds.
 */
export async function getNewCardsIntroducedToday(
  userId: string,
  deckId: string
): Promise<number> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const result = await prisma.userProgress.findMany({
    where: {
      userId,
      card: { deckId },
      createdAt: { gte: todayStart },
    },
    select: { cardId: true },
    distinct: ["cardId"],
  });

  return result.length;
}
