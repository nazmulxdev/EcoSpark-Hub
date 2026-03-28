/*
  Warnings:

  - A unique constraint covering the columns `[paymentId]` on the table `members` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `paymentId` to the `members` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "members" ADD COLUMN     "paymentId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "members_paymentId_key" ON "members"("paymentId");

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "membership_payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
