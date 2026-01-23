import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';

export default async function (fastify: FastifyInstance) {
  fastify.post('/register', async (request, reply) => {
    const body = request.body as any;
    if (!body?.email || !body?.password) {
      return reply.status(400).send({ error: 'email and password required' });
    }

    // check existing
    const existing = await (fastify as any).prisma.user.findUnique({
      where: { email: body.email },
    });
    if (existing) {
      return reply.status(409).send({ error: 'email already in use' });
    }

    const hashed = await bcrypt.hash(body.password, 10);
    fastify.log.info({ email: body.email }, 'register: creating user');
    const user = await (fastify as any).prisma.user.create({
      data: {
        name: body.name || null,
        email: body.email,
        password: hashed,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
    fastify.log.info({ id: user.id }, 'register: created user');

    return reply.status(201).send(user);
  });

  fastify.post('/login', async (request, reply) => {
    const body = request.body as any;
    if (!body?.email || !body?.password) {
      return reply.status(400).send({ error: 'email and password required' });
    }

    const user = await (fastify as any).prisma.user.findUnique({
      where: { email: body.email },
    });
    if (!user) {
      return reply.status(401).send({ error: 'invalid credentials' });
    }

    const valid = await bcrypt.compare(body.password, (user as any).password);
    if (!valid) {
      return reply.status(401).send({ error: 'invalid credentials' });
    }

    const token = (fastify as any).jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    return reply.send({ accessToken: token, tokenType: 'Bearer' });
  });
}
