import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import type { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth';
import bikeRoutes from './routes/bikes';
import ownerRoutes from './routes/owner';
import reportRoutes from './routes/reports';
import { sendError, UnauthorizedError } from './lib/errors';
import { requireAdmin } from './lib/auth';
import { AuthService } from './services/authService';
import type { OCRService } from './services/ocrService';

import prismaPlugin from './plugins/prisma';

type BuildServerOptions = {
  prisma?: PrismaClient;
  ocrService?: OCRService;
  now?: () => Date;
};

export function buildServer({ prisma, ocrService, now }: BuildServerOptions = {}) {
  const server = Fastify({ logger: false });
  console.log('Fastify instance created.');

  server.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || 'change-me',
  });
  console.log('JWT plugin registered.');

  if (prisma) {
    server.decorate('prisma', prisma);
    console.log('Prisma decorated (provided).');
  } else {
    prismaPlugin(server);
    console.log('Prisma plugin registered.');
  }

  server.get('/', async () => ({ ok: true, version: '0.1.0' }));

  // Protected route example
  server.get('/users/me', async (request, reply) => {
    try {
      const { userId } = await requireAdmin(request);
      const authService = new AuthService(server.prisma as any);
      const user = await authService.getUserProfile(userId);
      return reply.send(user);
    } catch (error) {
      const normalizedError =
        error instanceof Error && error.message.toLowerCase().includes('authorization')
          ? new UnauthorizedError('Unauthorized')
          : error;
      return sendError(reply, server.log, normalizedError);
    }
  });

  console.log('Registering auth routes...');
  server.register(authRoutes, { prefix: '/auth' });

  console.log('Registering report routes...');
  server.register(reportRoutes({ now }), { prefix: '/api/reports' });

  console.log('Registering bike routes...');
  server.register(bikeRoutes({ ocrService }), { prefix: '/bikes' });

  console.log('Registering owner routes...');
  server.register(ownerRoutes({ now }), { prefix: '/owner' });

  console.log('All routes registered.');

  return server;
}
