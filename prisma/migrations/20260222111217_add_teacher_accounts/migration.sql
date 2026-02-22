-- AlterTable
ALTER TABLE "AppSettings" ADD COLUMN     "allowTeacherRegistration" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Deck" ADD COLUMN     "createdById" TEXT;

-- AlterTable
ALTER TABLE "StudentGroup" ADD COLUMN     "createdById" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "createdById" TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deck" ADD CONSTRAINT "Deck_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentGroup" ADD CONSTRAINT "StudentGroup_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
