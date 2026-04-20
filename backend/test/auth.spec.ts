import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from '../src/app';
import bcrypt from 'bcryptjs';
import { createMockPrisma } from './helpers/mockPrisma';

describe('auth', () => {
  let server: any;
  let mockPrisma: any;

  beforeAll(() => {
    mockPrisma = createMockPrisma();
    server = buildServer({ prisma: mockPrisma.prisma as any });
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
    await mockPrisma.prisma.user.create({
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

  it('rejects duplicate email on register', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'vt@example.com', password: 'pass' },
    });

    expect(res.statusCode).toBe(409);
    expect(JSON.parse(res.payload)).toEqual({ error: 'email already in use' });
  });

  it('rejects invalid credentials on login', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'login@example.com', password: 'wrong-password' },
    });

    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res.payload)).toEqual({ error: 'invalid credentials' });
  });

  it('accesses protected route /users/me', async () => {
    const hashed = await bcrypt.hash('p', 10);
    const user = await mockPrisma.prisma.user.create({
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

  it('rejects unauthorized access to /users/me', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/users/me',
    });

    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res.payload)).toEqual({ error: 'Unauthorized' });
  });
});
