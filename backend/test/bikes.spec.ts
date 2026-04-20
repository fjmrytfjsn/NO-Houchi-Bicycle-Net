import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from '../src/app';
import { createMockPrisma } from './helpers/mockPrisma';

describe('bikes', () => {
  let server: any;
  let prismaBundle: ReturnType<typeof createMockPrisma>;

  beforeAll(() => {
    prismaBundle = createMockPrisma();
    server = buildServer({
      prisma: prismaBundle.prisma as any,
      ocrService: {
        recognizeRegistrationNumber: async () => ({
          success: true,
          registrationNumber: '12345678',
          confidence: 0.91,
          rawText: '防犯登録 12345678',
        }),
      },
    });
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

  it('rejects duplicate serial number', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/bikes',
      payload: { serialNumber: 'SN-1' },
    });

    expect(res.statusCode).toBe(409);
    expect(JSON.parse(res.payload)).toEqual({ error: 'serialNumber already exists' });
  });

  it('returns 404 for missing bike', async () => {
    const getRes = await server.inject({
      method: 'GET',
      url: '/bikes/missing-bike',
    });
    expect(getRes.statusCode).toBe(404);

    const putRes = await server.inject({
      method: 'PUT',
      url: '/bikes/missing-bike',
      payload: { status: 'maintenance' },
    });
    expect(putRes.statusCode).toBe(404);

    const delRes = await server.inject({
      method: 'DELETE',
      url: '/bikes/missing-bike',
    });
    expect(delRes.statusCode).toBe(404);
  });

  it('maps OCR service results through the endpoint', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/bikes/ocr/recognize',
      payload: { filePath: '/tmp/sample.jpg' },
    });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.payload)).toEqual({
      success: true,
      result: {
        registrationNumber: '12345678',
        confidence: 0.91,
        rawText: '防犯登録 12345678',
      },
    });
  });
});
