/*
  Warnings:

  - You are about to drop the column `error` on the `AgentRun` table. All the data in the column will be lost.
  - You are about to drop the column `input` on the `AgentRun` table. All the data in the column will be lost.
  - You are about to drop the column `output` on the `AgentRun` table. All the data in the column will be lost.
  - You are about to drop the column `toolLog` on the `AgentRun` table. All the data in the column will be lost.
  - The `status` column on the `AgentRun` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `inputSummary` to the `AgentRun` table without a default value. This is not possible if the table is not empty.
  - Added the required column `outputSummary` to the `AgentRun` table without a default value. This is not possible if the table is not empty.
  - Added the required column `toolCallLog` to the `AgentRun` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `agentType` on the `AgentRun` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "AgentRunStatus" AS ENUM ('PENDING', 'PROCESSING', 'PENDING_REVIEW', 'COMPLETED', 'FAILED');

-- DropIndex
DROP INDEX "AgentRun_agentType_idx";

-- DropIndex
DROP INDEX "AgentRun_createdAt_idx";

-- DropIndex
DROP INDEX "AgentRun_userId_idx";

-- AlterTable
ALTER TABLE "AgentRun" DROP COLUMN "error",
DROP COLUMN "input",
DROP COLUMN "output",
DROP COLUMN "toolLog",
ADD COLUMN     "inputSummary" TEXT NOT NULL,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "outputSummary" TEXT NOT NULL,
ADD COLUMN     "toolCallLog" JSONB NOT NULL,
DROP COLUMN "agentType",
ADD COLUMN     "agentType" TEXT NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "AgentRunStatus" NOT NULL DEFAULT 'PENDING';

-- DropEnum
DROP TYPE "AgentType";

-- DropEnum
DROP TYPE "RunStatus";

-- CreateTable
CREATE TABLE "WeeklyAgentPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekOf" TIMESTAMP(3) NOT NULL,
    "readinessScore" INTEGER NOT NULL,
    "skillFocus" JSONB NOT NULL,
    "resumeTips" JSONB NOT NULL,
    "interviewFocus" TEXT NOT NULL,
    "rawAgentOutput" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeeklyAgentPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WeeklyAgentPlan_userId_idx" ON "WeeklyAgentPlan"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyAgentPlan_userId_weekOf_key" ON "WeeklyAgentPlan"("userId", "weekOf");

-- CreateIndex
CREATE INDEX "AgentRun_userId_agentType_idx" ON "AgentRun"("userId", "agentType");

-- CreateIndex
CREATE INDEX "AgentRun_status_idx" ON "AgentRun"("status");

-- AddForeignKey
ALTER TABLE "WeeklyAgentPlan" ADD CONSTRAINT "WeeklyAgentPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
