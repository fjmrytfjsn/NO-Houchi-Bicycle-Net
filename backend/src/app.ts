import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import authRoutes from './routes/auth';
import bikeRoutes from './routes/bikes';

import prismaPlugin from './plugins/prisma';

export function buildServer({ prisma }: { prisma?: any } = {}) {
  const server = Fastify({ logger: false });

  server.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || 'change-me',
  });

  if (prisma) {
    server.decorate('prisma', prisma);
  } else {
    server.register(prismaPlugin);
  }

  server.get('/', async () => ({ ok: true, version: '0.1.0' }));

  // Protected route example
  server.get('/users/me', async (request, reply) => {
    try {
      await (request as any).jwtVerify();
    } catch (err) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
    const userId = (request as any).user.sub;
    const user = await (server as any).prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true },
    });
    if (!user) return reply.status(404).send({ error: 'User not found' });
    return reply.send(user);
  });

  server.register(authRoutes, { prefix: '/auth' });
  server.register(bikeRoutes, { prefix: '/bikes' });

  return server;
}
