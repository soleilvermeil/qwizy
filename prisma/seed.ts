import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}
const adapter = new PrismaPg({ connectionString });
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
      mustChangePassword: true,
      newCardsPerDay: 20,
    },
  });

  console.log("Created admin user:", admin);

  // Create default app settings
  const appSettings = await prisma.appSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      allowSelfRegistration: true,
    },
  });

  console.log("App settings:", appSettings);

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

  // Backfill: set createdById to admin for all existing users/decks/groups
  const usersUpdated = await prisma.user.updateMany({
    where: { id: { not: admin.id }, createdById: null },
    data: { createdById: admin.id },
  });
  if (usersUpdated.count > 0) {
    console.log(`Backfilled createdById on ${usersUpdated.count} user(s).`);
  }

  const decksUpdated = await prisma.deck.updateMany({
    where: { createdById: null },
    data: { createdById: admin.id },
  });
  if (decksUpdated.count > 0) {
    console.log(`Backfilled createdById on ${decksUpdated.count} deck(s).`);
  }

  const groupsUpdated = await prisma.studentGroup.updateMany({
    where: { createdById: null },
    data: { createdById: admin.id },
  });
  if (groupsUpdated.count > 0) {
    console.log(`Backfilled createdById on ${groupsUpdated.count} group(s).`);
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
