-- Create PendingChangeStatus enum
CREATE TYPE "PendingChangeStatus" AS ENUM ('pending', 'approved', 'rejected', 'partially_approved');

-- Create PendingChanges table
CREATE TABLE "PendingChanges" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "changes" JSONB NOT NULL,
    "metadata" JSONB NOT NULL,
    "status" "PendingChangeStatus" NOT NULL DEFAULT 'pending',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PendingChanges_pkey" PRIMARY KEY ("id")
);

-- Create index for user queries
CREATE INDEX "PendingChanges_userId_status_idx" ON "PendingChanges"("userId", "status");

-- Add foreign key constraint
ALTER TABLE "PendingChanges" ADD CONSTRAINT "PendingChanges_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
