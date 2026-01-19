import { PrismaClient } from '@prisma/client';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

const prisma = new PrismaClient();

export default async function (fastify: any, opts: any) {
  fastify.decorate('prisma', prisma);
  fastify.addHook('onClose', async () => {
    await prisma.$disconnect();
  });
}
