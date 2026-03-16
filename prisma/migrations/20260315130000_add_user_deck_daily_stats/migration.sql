-- CreateTable
CREATE TABLE "UserDeckDailyStat" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deckId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "difficultySum" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "difficultyCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserDeckDailyStat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserDeckDailyStat_userId_deckId_day_key" ON "UserDeckDailyStat"("userId", "deckId", "day");

-- CreateIndex
CREATE INDEX "UserDeckDailyStat_userId_day_idx" ON "UserDeckDailyStat"("userId", "day");

-- CreateIndex
CREATE INDEX "UserDeckDailyStat_deckId_day_idx" ON "UserDeckDailyStat"("deckId", "day");

-- AddForeignKey
ALTER TABLE "UserDeckDailyStat" ADD CONSTRAINT "UserDeckDailyStat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDeckDailyStat" ADD CONSTRAINT "UserDeckDailyStat_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "Deck"("id") ON DELETE CASCADE ON UPDATE CASCADE;
