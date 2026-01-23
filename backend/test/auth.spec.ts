import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from '../src/app';
import bcrypt from 'bcryptjs';

function makeMockPrisma() {
  const users = new Map();
  return {
    user: {
      findUnique: async ({ where: { email, id } }: any) => {
        if (email) {
          for (const u of users.values()) if (u.email === email) return u;
          return null;
        }
        if (id) return users.get(id) || null;
        return null;
      },
      create: async ({ data }: any) => {
        const id = 'u-' + (users.size + 1);
        const user = { id, ...data, createdAt: new Date() };
        users.set(id, user);
        return user;
      },
    },
  };
}

describe('auth', () => {
  let server: any;
  let mockPrisma: any;

  beforeAll(() => {
    mockPrisma = makeMockPrisma();
    server = buildServer({ prisma: mockPrisma });
  });

  afterAll(async () => {
    await server.close();
  });

  it('registers a user', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { name: 'VT User', email: 'vt@example.com', password: 'pass' },
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.payload);
    expect(body).toHaveProperty('id');
    expect(body.email).toBe('vt@example.com');
  });

  it('logs in and returns token', async () => {
    // create with hashed password
    const plain = 'secret123';
    const hashed = await bcrypt.hash(plain, 10);
    const created = await mockPrisma.user.create({
      data: { name: 'LoginUser', email: 'login@example.com', password: hashed },
    });

    const res = await server.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'login@example.com', password: plain },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body).toHaveProperty('accessToken');
  });

  it('accesses protected route /users/me', async () => {
    const hashed = await bcrypt.hash('p', 10);
    const user = await mockPrisma.user.create({
      data: { name: 'Me', email: 'me@example.com', password: hashed },
    });
    // sign with server's jwt
    const token = server.jwt.sign({ sub: user.id, email: user.email });

    const res = await server.inject({
      method: 'GET',
      url: '/users/me',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.email).toBe('me@example.com');
  });
});
