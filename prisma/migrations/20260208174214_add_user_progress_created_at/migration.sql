-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UserProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "showFieldId" TEXT NOT NULL,
    "askFieldId" TEXT NOT NULL,
    "easinessFactor" REAL NOT NULL DEFAULT 2.5,
    "interval" INTEGER NOT NULL DEFAULT 0,
    "repetitions" INTEGER NOT NULL DEFAULT 0,
    "dueDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReviewed" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserProgress_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UserProgress" ("askFieldId", "cardId", "dueDate", "easinessFactor", "id", "interval", "lastReviewed", "repetitions", "showFieldId", "userId", "createdAt") SELECT "askFieldId", "cardId", "dueDate", "easinessFactor", "id", "interval", "lastReviewed", "repetitions", "showFieldId", "userId", '2000-01-01T00:00:00.000Z' FROM "UserProgress";
DROP TABLE "UserProgress";
ALTER TABLE "new_UserProgress" RENAME TO "UserProgress";
CREATE UNIQUE INDEX "UserProgress_userId_cardId_showFieldId_askFieldId_key" ON "UserProgress"("userId", "cardId", "showFieldId", "askFieldId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
