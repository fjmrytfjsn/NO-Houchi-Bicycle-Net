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

  it('lists reports in descending createdAt order', async () => {
    await prismaBundle.prisma.marker.create({
      data: {
        code: 'LIST-MARKER-001',
      },
    });

    const first = await prismaBundle.prisma.bicycleReport.create({
      data: {
        markerId: 'm-2',
        imageUrl: 'https://example.com/report-list-1.jpg',
        latitude: 34.701,
        longitude: 135.491,
        identifierText: 'LIST-0001',
        status: 'reported',
      },
    });

    const second = await prismaBundle.prisma.bicycleReport.create({
      data: {
        markerId: 'm-2',
        imageUrl: 'https://example.com/report-list-2.jpg',
        latitude: 34.702,
        longitude: 135.492,
        identifierText: 'LIST-0002',
        status: 'collection_requested',
      },
    });

    prismaBundle.state.reports.get(first.id)!.createdAt = new Date('2026-04-20T09:00:00.000Z');
    prismaBundle.state.reports.get(second.id)!.createdAt = new Date('2026-04-20T10:00:00.000Z');
    prismaBundle.state.reports.get('r-1')!.createdAt = new Date('2026-04-20T08:00:00.000Z');

    const response = await server.inject({
      method: 'GET',
      url: '/api/reports',
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.payload)).toMatchObject([
      { id: second.id, status: 'collection_requested' },
      { id: first.id, status: 'reported' },
      { id: 'r-1', status: 'reported' },
    ]);
  });

  it('filters reports by status', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/api/reports?status=collection_requested',
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.payload)).toEqual([
      expect.objectContaining({
        status: 'collection_requested',
      }),
    ]);
  });

  it('gets a report by id', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/api/reports/r-2',
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.payload)).toMatchObject({
      id: 'r-2',
      imageUrl: 'https://example.com/report-list-1.jpg',
      identifierText: 'LIST-0001',
      status: 'reported',
    });
  });

  it('returns 404 when report id does not exist', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/api/reports/r-999',
    });

    expect(response.statusCode).toBe(404);
    expect(JSON.parse(response.payload)).toEqual({ error: 'report not found' });
  });

  it('creates a report for an existing marker', async () => {
    const existingMarker = await prismaBundle.prisma.marker.create({
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
      markerId: existingMarker.id,
      status: 'reported',
      notes: null,
    });
    expect(prismaBundle.state.markers.size).toBeGreaterThanOrEqual(2);
    expect(prismaBundle.state.reports.size).toBeGreaterThanOrEqual(2);
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
