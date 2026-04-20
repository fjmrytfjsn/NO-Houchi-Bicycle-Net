import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import type { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth';
import bikeRoutes from './routes/bikes';
import ownerRoutes from './routes/owner';
import { sendError, UnauthorizedError } from './lib/errors';
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

  server.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || 'change-me',
  });

  if (prisma) {
    server.decorate('prisma', prisma);
  } else {
    prismaPlugin(server);
  }

  server.get('/', async () => ({ ok: true, version: '0.1.0' }));

  // Protected route example
  server.get('/users/me', async (request, reply) => {
    try {
      await request.jwtVerify();
      const tokenPayload = request.user as { sub?: string | number } | undefined;
      const userId = tokenPayload?.sub ? String(tokenPayload.sub) : '';
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

  server.register(authRoutes, { prefix: '/auth' });
  server.register(bikeRoutes({ ocrService }), { prefix: '/bikes' });
  server.register(ownerRoutes({ now }), { prefix: '/owner' });

  return server;
}
