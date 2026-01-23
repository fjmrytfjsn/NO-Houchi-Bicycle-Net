import { buildServer } from './app';

const server = buildServer();

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
