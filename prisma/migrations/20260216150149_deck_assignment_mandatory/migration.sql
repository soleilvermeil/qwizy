-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DeckGroupAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deckId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "mandatory" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "DeckGroupAssignment_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "Deck" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DeckGroupAssignment_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "StudentGroup" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_DeckGroupAssignment" ("deckId", "groupId", "id") SELECT "deckId", "groupId", "id" FROM "DeckGroupAssignment";
DROP TABLE "DeckGroupAssignment";
ALTER TABLE "new_DeckGroupAssignment" RENAME TO "DeckGroupAssignment";
CREATE UNIQUE INDEX "DeckGroupAssignment_deckId_groupId_key" ON "DeckGroupAssignment"("deckId", "groupId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
