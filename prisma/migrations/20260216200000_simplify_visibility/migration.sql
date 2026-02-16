-- Rename RESTRICTED to EDUCATION_ONLY in Deck visibility
UPDATE "Deck" SET "visibility" = 'EDUCATION_ONLY' WHERE "visibility" = 'RESTRICTED';

-- RedefineTables: drop canBrowsePublicDecks from StudentGroup
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_StudentGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_StudentGroup" ("createdAt", "id", "name") SELECT "createdAt", "id", "name" FROM "StudentGroup";
DROP TABLE "StudentGroup";
ALTER TABLE "new_StudentGroup" RENAME TO "StudentGroup";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
