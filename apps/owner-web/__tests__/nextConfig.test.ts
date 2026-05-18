/** @jest-environment node */

function loadConfig() {
  jest.resetModules();
  return require('../next.config');
}

describe('next config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.OWNER_API_BASE_URL;
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('keeps owner API requests local when backend URL is not configured', async () => {
    const config = loadConfig();

    await expect(config.rewrites()).resolves.toEqual([]);
  });

  it('proxies owner API requests to configured backend URL', async () => {
    process.env.OWNER_API_BASE_URL = 'http://localhost:4000/';
    const config = loadConfig();

    await expect(config.rewrites()).resolves.toEqual([
      {
        source: '/api/owner/:path*',
        destination: 'http://localhost:4000/owner/:path*',
      },
    ]);
  });

  it('falls back to NEXT_PUBLIC_API_BASE_URL like admin-dashboard', async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = 'http://localhost:3000';
    const config = loadConfig();

    await expect(config.rewrites()).resolves.toEqual([
      {
        source: '/api/owner/:path*',
        destination: 'http://localhost:3000/owner/:path*',
      },
    ]);
  });
});
