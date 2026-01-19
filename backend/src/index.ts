import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import authRoutes from './routes/auth';
import bikeRoutes from './routes/bikes';

const server = Fastify({ logger: true });

server.register(fastifyJwt, { secret: process.env.JWT_SECRET || 'change-me' });

server.get('/', async () => ({ ok: true, version: '0.1.0' }));

server.register(authRoutes, { prefix: '/auth' });
server.register(bikeRoutes, { prefix: '/bikes' });

const start = async () => {
  try {
    const port = Number(process.env.PORT || 3000);
    await server.listen({ port, host: '0.0.0.0' });
    server.log.info(`Server listening on ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
