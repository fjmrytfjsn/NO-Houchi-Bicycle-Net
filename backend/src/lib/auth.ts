import type { FastifyRequest } from 'fastify';
import { ForbiddenError, UnauthorizedError } from './errors';

type JwtUser = {
  sub?: string | number;
  role?: string;
};

export async function requireAdmin(request: FastifyRequest) {
  try {
    await request.jwtVerify();
  } catch {
    throw new UnauthorizedError('Unauthorized');
  }

  const user = request.user as JwtUser | undefined;

  if (!user?.sub) {
    throw new UnauthorizedError('Unauthorized');
  }

  if (user.role !== 'admin') {
    throw new ForbiddenError('Forbidden');
  }

  return {
    userId: String(user.sub),
    role: user.role,
  };
}
