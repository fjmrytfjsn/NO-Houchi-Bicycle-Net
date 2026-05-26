ALTER TABLE "BicycleReport"
ADD COLUMN "isCollectionCandidate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "collectionCandidateDecision" TEXT NOT NULL DEFAULT 'none',
ADD COLUMN "collectionCandidateFlaggedAt" TIMESTAMP(3);
