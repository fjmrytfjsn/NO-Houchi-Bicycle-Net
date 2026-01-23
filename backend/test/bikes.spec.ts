import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from '../src/app';

function makeMockPrisma() {
  const bikes = new Map();
  return {
    bike: {
      findMany: async () => Array.from(bikes.values()),
      findUnique: async ({ where: { id, serialNumber } }: any) => {
        if (id) return bikes.get(id) || null;
        if (serialNumber)
          for (const b of bikes.values())
            if (b.serialNumber === serialNumber) return b;
        return null;
      },
      create: async ({ data }: any) => {
        const id = 'b-' + (bikes.size + 1);
        const bike = { id, ...data, createdAt: new Date() };
        bikes.set(id, bike);
        return bike;
      },
      update: async ({ where: { id }, data }: any) => {
        const b = bikes.get(id);
        if (!b) throw new Error('not found');
        const updated = { ...b, ...data };
        bikes.set(id, updated);
        return updated;
      },
      delete: async ({ where: { id } }: any) => {
        const b = bikes.get(id);
        if (!b) throw new Error('not found');
        bikes.delete(id);
        return b;
      },
    },
  };
}

describe('bikes', () => {
  let server: any;
  let mockPrisma: any;

  beforeAll(() => {
    mockPrisma = makeMockPrisma();
    server = buildServer({ prisma: mockPrisma });
  });

  afterAll(async () => {
    await server.close();
  });

  it('creates and lists bikes', async () => {
    const res1 = await server.inject({
      method: 'POST',
      url: '/bikes',
      payload: { serialNumber: 'SN-1', location: 'A' },
    });
    expect(res1.statusCode).toBe(201);
    const b = JSON.parse(res1.payload);
    expect(b.serialNumber).toBe('SN-1');

    const res2 = await server.inject({ method: 'GET', url: '/bikes' });
    expect(res2.statusCode).toBe(200);
    const list = JSON.parse(res2.payload);
    expect(list.length).toBe(1);
  });

  it('gets, updates, and deletes a bike', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/bikes',
      payload: { serialNumber: 'SN-2' },
    });
    const bike = JSON.parse(res.payload);

    const getRes = await server.inject({
      method: 'GET',
      url: `/bikes/${bike.id}`,
    });
    expect(getRes.statusCode).toBe(200);

    const putRes = await server.inject({
      method: 'PUT',
      url: `/bikes/${bike.id}`,
      payload: { status: 'maintenance' },
    });
    expect(putRes.statusCode).toBe(200);
    const updated = JSON.parse(putRes.payload);
    expect(updated.status).toBe('maintenance');

    const delRes = await server.inject({
      method: 'DELETE',
      url: `/bikes/${bike.id}`,
    });
    expect(delRes.statusCode).toBe(204);
  });
});
