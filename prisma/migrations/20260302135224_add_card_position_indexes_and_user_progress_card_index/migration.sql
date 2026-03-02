-- CreateIndex
CREATE INDEX "Card_deckId_position_idx" ON "Card"("deckId", "position");

-- CreateIndex
CREATE INDEX "UserProgress_cardId_idx" ON "UserProgress"("cardId");
