import type { FastifyPluginAsync } from 'fastify';
import { sendError } from '../lib/errors';
import { AuthService } from '../services/authService';

type RegisterBody = {
  name?: string | null;
  email?: string;
  password?: string;
};

type LoginBody = {
  email?: string;
  password?: string;
};

const authRoutes: FastifyPluginAsync = async (fastify) => {
  const authService = new AuthService(fastify.prisma as any);

  fastify.post<{ Body: RegisterBody }>('/register', async (request, reply) => {
    try {
      const user = await authService.register(request.body ?? {});
      return reply.status(201).send(user);
    } catch (error) {
      return sendError(reply, fastify.log, error);
    }
  });

  fastify.post<{ Body: LoginBody }>('/login', async (request, reply) => {
    try {
      const user = await authService.login(request.body ?? {});
      const token = fastify.jwt.sign({
        sub: user.id,
        email: user.email,
        role: user.role,
      });
      return reply.send({ accessToken: token, tokenType: 'Bearer' });
    } catch (error) {
      return sendError(reply, fastify.log, error);
    }
  });
};

export default authRoutes;
