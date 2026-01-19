import { FastifyInstance } from 'fastify';

export default async function (fastify: FastifyInstance) {
  fastify.get('/', async (request, reply) => {
    // TODO: return bikes from database
    return reply.send([]);
  });

  fastify.post('/', async (request, reply) => {
    const body = request.body as any;
    if (!body?.serialNumber) {
      return reply.status(400).send({ error: 'serialNumber required' });
    }
    const bike = {
      id: 'bike-1',
      serialNumber: body.serialNumber,
      status: 'available',
    };
    return reply.status(201).send(bike);
  });

  fastify.get('/:id', async (request, reply) => {
    const params = request.params as any;
    const bike = { id: params.id, serialNumber: 'SN-001', status: 'available' };
    return reply.send(bike);
  });

  fastify.put('/:id', async (request, reply) => {
    const params = request.params as any;
    const body = request.body as any;
    // TODO: update bike in DB
    const bike = {
      id: params.id,
      serialNumber: 'SN-001',
      status: body.status || 'available',
    };
    return reply.send(bike);
  });

  fastify.delete('/:id', async (request, reply) => {
    return reply.status(204).send();
  });
}
