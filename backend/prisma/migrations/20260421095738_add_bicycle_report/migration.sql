-- CreateTable
CREATE TABLE "BicycleReport" (
    "id" TEXT NOT NULL,
    "markerId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "identifierText" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'reported',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BicycleReport_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BicycleReport" ADD CONSTRAINT "BicycleReport_markerId_fkey" FOREIGN KEY ("markerId") REFERENCES "Marker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
