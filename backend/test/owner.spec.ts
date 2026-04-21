import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildServer } from '../src/app';
import { createMockPrisma } from './helpers/mockPrisma';

describe('owner', () => {
  let server: any;
  let prismaBundle: ReturnType<typeof createMockPrisma>;
  let currentTime: Date;

  beforeAll(() => {
    prismaBundle = createMockPrisma();
    currentTime = new Date('2026-04-20T09:00:00.000Z');
    server = buildServer({
      prisma: prismaBundle.prisma as any,
      now: () => currentTime,
    });
  });

  afterAll(async () => {
    await server.close();
  });

  it('returns marker details with the latest report and declaration', async () => {
    const marker = await prismaBundle.prisma.marker.create({
      data: { code: 'DETAIL-001' },
    });

    await prismaBundle.prisma.bicycleReport.create({
      data: {
        markerId: marker.id,
        imageUrl: 'https://example.com/old.jpg',
        latitude: 34.7001,
        longitude: 135.5001,
        identifierText: 'OLD-TEXT',
        status: 'reported',
      },
    });

    const latestReport = await prismaBundle.prisma.bicycleReport.create({
      data: {
        markerId: marker.id,
        imageUrl: 'https://example.com/latest.jpg',
        latitude: 34.7002,
        longitude: 135.5002,
        identifierText: 'LATEST-TEXT',
        status: 'temporary',
      },
    });
    const oldReport = prismaBundle.state.reports.get('r-1');
    if (oldReport) {
      oldReport.createdAt = new Date('2026-04-20T08:30:00.000Z');
      oldReport.updatedAt = new Date('2026-04-20T08:30:00.000Z');
      prismaBundle.state.reports.set(oldReport.id, oldReport);
    }
    const latestReportRecord = prismaBundle.state.reports.get(latestReport.id);
    if (latestReportRecord) {
      latestReportRecord.createdAt = new Date('2026-04-20T09:30:00.000Z');
      latestReportRecord.updatedAt = new Date('2026-04-20T09:30:00.000Z');
      prismaBundle.state.reports.set(latestReportRecord.id, latestReportRecord);
    }

    await prismaBundle.prisma.declaration.create({
      data: {
        markerId: marker.id,
        declaredAt: new Date('2026-04-20T08:00:00.000Z'),
        eligibleFinalAt: new Date('2026-04-20T08:15:00.000Z'),
        expiresAt: new Date('2026-04-21T08:00:00.000Z'),
        status: 'resolved',
      },
    });

    const latestDeclaration = await prismaBundle.prisma.declaration.create({
      data: {
        markerId: marker.id,
        declaredAt: new Date('2026-04-20T09:00:00.000Z'),
        eligibleFinalAt: new Date('2026-04-20T09:15:00.000Z'),
        expiresAt: new Date('2026-04-21T09:00:00.000Z'),
        status: 'temporary',
      },
    });

    const response = await server.inject({
      method: 'GET',
      url: '/owner/markers/DETAIL-001',
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.payload)).toEqual({
      marker: {
        code: 'DETAIL-001',
      },
      report: {
        ...latestReport,
        createdAt: '2026-04-20T09:30:00.000Z',
        updatedAt: '2026-04-20T09:30:00.000Z',
      },
      declaration: {
        ...latestDeclaration,
        declaredAt: latestDeclaration.declaredAt.toISOString(),
        eligibleFinalAt: latestDeclaration.eligibleFinalAt.toISOString(),
        expiresAt: latestDeclaration.expiresAt.toISOString(),
        finalizedAt: latestDeclaration.finalizedAt,
        createdAt: latestDeclaration.createdAt.toISOString(),
        updatedAt: latestDeclaration.updatedAt.toISOString(),
      },
    });
  });

  it('returns nulls when marker has no report or declaration', async () => {
    await prismaBundle.prisma.marker.create({
      data: { code: 'DETAIL-EMPTY' },
    });

    const response = await server.inject({
      method: 'GET',
      url: '/owner/markers/DETAIL-EMPTY',
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.payload)).toEqual({
      marker: { code: 'DETAIL-EMPTY' },
      report: null,
      declaration: null,
    });
  });

  it('returns null declaration when marker has only a report', async () => {
    const marker = await prismaBundle.prisma.marker.create({
      data: { code: 'DETAIL-REPORT-ONLY' },
    });

    const report = await prismaBundle.prisma.bicycleReport.create({
      data: {
        markerId: marker.id,
        imageUrl: 'https://example.com/report-only.jpg',
        latitude: 34.701,
        longitude: 135.501,
        identifierText: 'REPORT-ONLY',
        status: 'reported',
      },
    });

    const response = await server.inject({
      method: 'GET',
      url: '/owner/markers/DETAIL-REPORT-ONLY',
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.payload)).toEqual({
      marker: { code: 'DETAIL-REPORT-ONLY' },
      report: {
        ...report,
        createdAt: report.createdAt.toISOString(),
        updatedAt: report.updatedAt.toISOString(),
      },
      declaration: null,
    });
  });

  it('returns 404 when marker code does not exist', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/owner/markers/UNKNOWN-CODE',
    });

    expect(response.statusCode).toBe(404);
    expect(JSON.parse(response.payload)).toEqual({
      error: 'Marker not found',
    });
  });

  it('creates a temporary unlock declaration', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/owner/markers/ABC123/unlock-temp',
      payload: { notes: '移動済み' },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.status).toBe('temporary');
    expect(body.declaredAt).toBe('2026-04-20T09:00:00.000Z');
    expect(body.eligibleFinalAt).toBe('2026-04-20T09:15:00.000Z');
    expect(body.expiresAt).toBe('2026-04-21T09:00:00.000Z');
  });

  it('rejects final unlock when no temporary declaration exists', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/owner/markers/NO-DECLARATION/unlock-final',
      payload: { scannedCode: 'NO-DECLARATION' },
    });

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.payload)).toEqual({ error: 'No temporary declaration found' });
  });

  it('rejects final unlock before eligibleFinalAt', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/owner/markers/ABC123/unlock-final',
      payload: { scannedCode: 'ABC123' },
    });

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.payload)).toMatchObject({
      error: 'eligibleFinalAt has not arrived',
      eligibleFinalAt: '2026-04-20T09:15:00.000Z',
    });
  });

  it('rejects final unlock when scannedCode does not match', async () => {
    currentTime = new Date('2026-04-20T09:20:00.000Z');

    const response = await server.inject({
      method: 'POST',
      url: '/owner/markers/ABC123/unlock-final',
      payload: { scannedCode: 'DIFFERENT-CODE' },
    });

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.payload)).toEqual({
      error: 'scannedCode does not match marker code',
    });
  });

  it('finalizes unlock and issues a coupon when available', async () => {
    prismaBundle.seedCoupon();

    const response = await server.inject({
      method: 'POST',
      url: '/owner/markers/ABC123/unlock-final',
      payload: { scannedCode: 'ABC123', ownerEmail: 'owner@example.com' },
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.payload)).toMatchObject({
      status: 'resolved',
      message: 'クーポンを獲得しました！商店街でご利用ください。',
      coupon: {
        name: '商店街お買い物券500円',
        shopName: '北区商店街',
        discount: 500,
      },
    });
  });

  it('returns a resolved response without coupon when no active coupon exists', async () => {
    currentTime = new Date('2026-04-20T10:00:00.000Z');

    const tempResponse = await server.inject({
      method: 'POST',
      url: '/owner/markers/NO-COUPON/unlock-temp',
      payload: {},
    });
    expect(tempResponse.statusCode).toBe(200);

    currentTime = new Date('2026-04-20T10:20:00.000Z');
    prismaBundle.state.coupons.clear();

    const response = await server.inject({
      method: 'POST',
      url: '/owner/markers/NO-COUPON/unlock-final',
      payload: { scannedCode: 'NO-COUPON' },
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.payload)).toMatchObject({
      status: 'resolved',
      coupon: null,
      message: '本解除が完了しました',
    });
  });

  it('lists and uses coupons, and rejects expired coupons', async () => {
    currentTime = new Date('2026-04-20T11:00:00.000Z');
    prismaBundle.seedCoupon({ validDays: 1 });

    await server.inject({
      method: 'POST',
      url: '/owner/markers/USE-COUPON/unlock-temp',
      payload: {},
    });

    currentTime = new Date('2026-04-20T11:20:00.000Z');
    await server.inject({
      method: 'POST',
      url: '/owner/markers/USE-COUPON/unlock-final',
      payload: { scannedCode: 'USE-COUPON' },
    });

    const listResponse = await server.inject({
      method: 'GET',
      url: '/owner/markers/USE-COUPON/coupons',
    });

    expect(listResponse.statusCode).toBe(200);
    const coupons = JSON.parse(listResponse.payload).coupons;
    expect(coupons).toHaveLength(1);

    const useResponse = await server.inject({
      method: 'POST',
      url: `/owner/coupons/${coupons[0].id}/use`,
    });
    expect(useResponse.statusCode).toBe(200);

    const reuseResponse = await server.inject({
      method: 'POST',
      url: `/owner/coupons/${coupons[0].id}/use`,
    });
    expect(reuseResponse.statusCode).toBe(400);

    const expiredCoupon = prismaBundle.seedCoupon({ validDays: 1 });
    const expiredIssuance = await prismaBundle.prisma.couponIssuance.create({
      data: {
        couponId: expiredCoupon.id,
        markerId: 'expired-marker',
        expiresAt: new Date('2026-04-19T00:00:00.000Z'),
        status: 'active',
      },
    });

    const expiredResponse = await server.inject({
      method: 'POST',
      url: `/owner/coupons/${expiredIssuance.id}/use`,
    });
    expect(expiredResponse.statusCode).toBe(400);
  });
});
