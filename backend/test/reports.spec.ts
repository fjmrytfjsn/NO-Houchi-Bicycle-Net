import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildServer } from '../src/app';
import { createMockPrisma } from './helpers/mockPrisma';

describe('reports', () => {
  let server: any;
  let prismaBundle: ReturnType<typeof createMockPrisma>;

  beforeAll(() => {
    prismaBundle = createMockPrisma();
    server = buildServer({
      prisma: prismaBundle.prisma as any,
    });
  });

  afterAll(async () => {
    await server.close();
  });

  it('creates a report and creates a marker when markerCode is new', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/reports',
      payload: {
        imageUrl: 'https://example.com/report-1.jpg',
        latitude: 34.7055,
        longitude: 135.4983,
        markerCode: 'NEW-MARKER-001',
        identifierText: 'OSAKA-1234',
        notes: '歩道の端に駐輪',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(JSON.parse(response.payload)).toMatchObject({
      markerId: 'm-1',
      imageUrl: 'https://example.com/report-1.jpg',
      latitude: 34.7055,
      longitude: 135.4983,
      identifierText: 'OSAKA-1234',
      status: 'reported',
      notes: '歩道の端に駐輪',
    });
    expect(prismaBundle.state.markers.size).toBe(1);
    expect(prismaBundle.state.reports.size).toBe(1);
  });

  it('creates a report for an existing marker', async () => {
    await prismaBundle.prisma.marker.create({
      data: {
        code: 'EXISTING-MARKER-001',
      },
    });

    const response = await server.inject({
      method: 'POST',
      url: '/api/reports',
      payload: {
        imageUrl: 'https://example.com/report-2.jpg',
        latitude: 34.70,
        longitude: 135.49,
        markerCode: 'EXISTING-MARKER-001',
        identifierText: 'KITA-9999',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(JSON.parse(response.payload)).toMatchObject({
      markerId: 'm-2',
      status: 'reported',
      notes: null,
    });
    expect(prismaBundle.state.markers.size).toBe(2);
    expect(prismaBundle.state.reports.size).toBe(2);
  });

  it('rejects when imageUrl is missing', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/reports',
      payload: {
        latitude: 34.7055,
        longitude: 135.4983,
        markerCode: 'INVALID-001',
        identifierText: 'OSAKA-0001',
      },
    });

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.payload)).toEqual({ error: 'imageUrl required' });
  });

  it('rejects when latitude or longitude is invalid', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/reports',
      payload: {
        imageUrl: 'https://example.com/report-invalid.jpg',
        latitude: '34.7055',
        longitude: 135.4983,
        markerCode: 'INVALID-002',
        identifierText: 'OSAKA-0002',
      },
    });

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.payload)).toEqual({ error: 'latitude and longitude must be numbers' });
  });

  it('rejects when markerCode is missing', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/reports',
      payload: {
        imageUrl: 'https://example.com/report-invalid.jpg',
        latitude: 34.7055,
        longitude: 135.4983,
        identifierText: 'OSAKA-0003',
      },
    });

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.payload)).toEqual({ error: 'markerCode required' });
  });

  it('rejects when identifierText is missing', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/reports',
      payload: {
        imageUrl: 'https://example.com/report-invalid.jpg',
        latitude: 34.7055,
        longitude: 135.4983,
        markerCode: 'INVALID-003',
      },
    });

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.payload)).toEqual({ error: 'identifierText required' });
  });
});
