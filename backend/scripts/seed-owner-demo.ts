import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const code = 'ABC123';
  
  // Create or get Marker
  const marker = await prisma.marker.upsert({
    where: { code },
    update: {},
    create: { code, location: '34.7055, 135.4983' },
  });

  // Create Bicycle Report
  const report = await prisma.bicycleReport.create({
    data: {
      markerId: marker.id,
      imageUrl: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=800',
      latitude: 34.7055,
      longitude: 135.4983,
      identifierText: 'OSAKA-12345678',
      status: 'reported',
      notes: '放置自転車のテストデータです',
    },
  });

  console.log(`Seeded marker ${code} with report ${report.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
