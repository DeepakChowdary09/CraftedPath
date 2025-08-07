/*
  Warnings:

  - Added the required column `questions` to the `Assessments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Assessments" ADD COLUMN     "questions" JSONB NOT NULL;

-- CreateIndex
CREATE INDEX "Assessments_userId_idx" ON "public"."Assessments"("userId");
