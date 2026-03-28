/*
  Warnings:

  - A unique constraint covering the columns `[stripeEventId]` on the table `idea_payments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripeEventId]` on the table `membership_payments` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "idea_payments" ADD COLUMN     "stripeEventId" TEXT;

-- AlterTable
ALTER TABLE "membership_payments" ADD COLUMN     "stripeEventId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "idea_payments_stripeEventId_key" ON "idea_payments"("stripeEventId");

-- CreateIndex
CREATE UNIQUE INDEX "membership_payments_stripeEventId_key" ON "membership_payments"("stripeEventId");
