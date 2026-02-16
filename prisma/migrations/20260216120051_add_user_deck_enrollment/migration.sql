/*
  Warnings:

  - You are about to drop the column `easinessFactor` on the `UserProgress` table. All the data in the column will be lost.
  - You are about to drop the column `interval` on the `UserProgress` table. All the data in the column will be lost.
  - You are about to drop the column `repetitions` on the `UserProgress` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "UserDeck" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "deckId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserDeck_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserDeck_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "Deck" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DeckQuestionType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deckId" TEXT NOT NULL,
    "showFieldId" TEXT NOT NULL,
    "askFieldId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "useAsQuestion" BOOLEAN NOT NULL DEFAULT true,
    "useAsExplanation" BOOLEAN NOT NULL DEFAULT false,
    "showTtsLang" TEXT,
    "showTtsFieldId" TEXT,
    "showTtsStopAt" TEXT,
    "askTtsLang" TEXT,
    "askTtsFieldId" TEXT,
    "askTtsStopAt" TEXT,
    "showHintFieldIds" TEXT,
    "askHintFieldIds" TEXT,
    CONSTRAINT "DeckQuestionType_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "Deck" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_DeckQuestionType" ("askFieldId", "deckId", "id", "position", "showFieldId") SELECT "askFieldId", "deckId", "id", "position", "showFieldId" FROM "DeckQuestionType";
DROP TABLE "DeckQuestionType";
ALTER TABLE "new_DeckQuestionType" RENAME TO "DeckQuestionType";
CREATE UNIQUE INDEX "DeckQuestionType_deckId_showFieldId_askFieldId_key" ON "DeckQuestionType"("deckId", "showFieldId", "askFieldId");
CREATE TABLE "new_UserProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "showFieldId" TEXT NOT NULL,
    "askFieldId" TEXT NOT NULL,
    "stability" REAL NOT NULL DEFAULT 0,
    "difficulty" REAL NOT NULL DEFAULT 0,
    "state" INTEGER NOT NULL DEFAULT 0,
    "reps" INTEGER NOT NULL DEFAULT 0,
    "lapses" INTEGER NOT NULL DEFAULT 0,
    "scheduledDays" INTEGER NOT NULL DEFAULT 0,
    "elapsedDays" INTEGER NOT NULL DEFAULT 0,
    "learningSteps" INTEGER NOT NULL DEFAULT 0,
    "dueDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReviewed" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserProgress_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UserProgress" ("askFieldId", "cardId", "createdAt", "dueDate", "id", "lastReviewed", "showFieldId", "userId") SELECT "askFieldId", "cardId", "createdAt", "dueDate", "id", "lastReviewed", "showFieldId", "userId" FROM "UserProgress";
DROP TABLE "UserProgress";
ALTER TABLE "new_UserProgress" RENAME TO "UserProgress";
CREATE UNIQUE INDEX "UserProgress_userId_cardId_showFieldId_askFieldId_key" ON "UserProgress"("userId", "cardId", "showFieldId", "askFieldId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "UserDeck_userId_deckId_key" ON "UserDeck"("userId", "deckId");
