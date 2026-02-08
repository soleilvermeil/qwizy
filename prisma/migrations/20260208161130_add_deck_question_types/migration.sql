-- CreateTable
CREATE TABLE "DeckQuestionType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deckId" TEXT NOT NULL,
    "showFieldId" TEXT NOT NULL,
    "askFieldId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "DeckQuestionType_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "Deck" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "DeckQuestionType_deckId_showFieldId_askFieldId_key" ON "DeckQuestionType"("deckId", "showFieldId", "askFieldId");
