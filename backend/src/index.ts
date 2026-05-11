import { buildServer } from './app';

const server = buildServer();

const start = async () => {
  console.log('Starting server initialization...');
  try {
    const port = Number(process.env.PORT || 3000);
    await server.listen({ port, host: '127.0.0.1' });
    console.log(`✅ Server listening on http://127.0.0.1:${port}`);
  } catch (err) {
    console.error('❌ Server failed to start:', err);
    process.exit(1);
  }
};

start();
