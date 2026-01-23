import { FastifyInstance } from 'fastify';

export default async function (fastify: FastifyInstance) {
  // List bikes
  fastify.get('/', async (request, reply) => {
    const bikes = await (fastify as any).prisma.bike.findMany();
    return reply.send(bikes);
  });

  // Create bike
  fastify.post('/', async (request, reply) => {
    const body = request.body as any;
    if (!body?.serialNumber) {
      return reply.status(400).send({ error: 'serialNumber required' });
    }

    const existing = await (fastify as any).prisma.bike.findUnique({
      where: { serialNumber: body.serialNumber },
    });
    if (existing)
      return reply.status(409).send({ error: 'serialNumber already exists' });

    const bike = await (fastify as any).prisma.bike.create({
      data: {
        serialNumber: body.serialNumber,
        location: body.location || null,
        status: body.status || 'available',
      },
    });

    return reply.status(201).send(bike);
  });

  // Get bike
  fastify.get('/:id', async (request, reply) => {
    const params = request.params as any;
    const bike = await (fastify as any).prisma.bike.findUnique({
      where: { id: params.id },
    });
    if (!bike) return reply.status(404).send({ error: 'not found' });
    return reply.send(bike);
  });

  // Update bike
  fastify.put('/:id', async (request, reply) => {
    const params = request.params as any;
    const body = request.body as any;
    try {
      const bike = await (fastify as any).prisma.bike.update({
        where: { id: params.id },
        data: {
          location: body.location,
          status: body.status,
        },
      });
      return reply.send(bike);
    } catch (err) {
      return reply.status(404).send({ error: 'not found' });
    }
  });

  // Delete bike
  fastify.delete('/:id', async (request, reply) => {
    const params = request.params as any;
    try {
      await (fastify as any).prisma.bike.delete({ where: { id: params.id } });
      return reply.status(204).send();
    } catch (err) {
      return reply.status(404).send({ error: 'not found' });
    }
  });
}
