-- CreateEnum
CREATE TYPE "Mode" AS ENUM ('COMMON_GROUND', 'COMMON_GROUND_AND_VERDICT');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('COLLECTING', 'JUDGING', 'DECIDED', 'FAILED');

-- CreateEnum
CREATE TYPE "Slot" AS ENUM ('A', 'B');

-- CreateEnum
CREATE TYPE "Kind" AS ENUM ('OPENING', 'CONTEXT', 'PROPOSAL', 'EVIDENCE');

-- CreateTable
CREATE TABLE "Case" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "mode" "Mode" NOT NULL DEFAULT 'COMMON_GROUND',
    "status" "Status" NOT NULL DEFAULT 'COLLECTING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Party" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "slot" "Slot" NOT NULL,
    "displayName" TEXT,
    "tokenHash" TEXT NOT NULL,
    "lockedAt" TIMESTAMP(3),

    CONSTRAINT "Party_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Statement" (
    "id" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "kind" "Kind" NOT NULL,
    "body" TEXT NOT NULL,
    "links" TEXT[],

    CONSTRAINT "Statement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verdict" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "json" JSONB NOT NULL,
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Verdict_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Party_tokenHash_key" ON "Party"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "Party_caseId_slot_key" ON "Party"("caseId", "slot");

-- CreateIndex
CREATE UNIQUE INDEX "Statement_partyId_kind_key" ON "Statement"("partyId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "Verdict_caseId_key" ON "Verdict"("caseId");

-- AddForeignKey
ALTER TABLE "Party" ADD CONSTRAINT "Party_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Statement" ADD CONSTRAINT "Statement_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Party"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Verdict" ADD CONSTRAINT "Verdict_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;
