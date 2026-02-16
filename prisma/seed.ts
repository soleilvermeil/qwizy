import "dotenv/config";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../app/generated/prisma/client";

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

async function main() {
  // Create default admin user with no password
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      passwordHash: null,
      isAdmin: true,
      newCardsPerDay: 20,
    },
  });

  console.log("Created admin user:", admin);

  // Backfill: auto-enroll users into decks where they already have progress
  const progressPairs = await prisma.userProgress.findMany({
    select: {
      userId: true,
      card: { select: { deckId: true } },
    },
  });

  const uniquePairs = new Map<string, { userId: string; deckId: string }>();
  for (const p of progressPairs) {
    const key = `${p.userId}:${p.card.deckId}`;
    if (!uniquePairs.has(key)) {
      uniquePairs.set(key, { userId: p.userId, deckId: p.card.deckId });
    }
  }

  let enrollCount = 0;
  for (const { userId, deckId } of uniquePairs.values()) {
    await prisma.userDeck.upsert({
      where: { userId_deckId: { userId, deckId } },
      update: {},
      create: { userId, deckId },
    });
    enrollCount++;
  }

  if (enrollCount > 0) {
    console.log(`Backfilled ${enrollCount} deck enrollment(s) from existing progress.`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
