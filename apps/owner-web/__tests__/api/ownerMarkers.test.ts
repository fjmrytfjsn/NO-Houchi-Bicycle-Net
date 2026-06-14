/** @jest-environment node */
import handler from '../../pages/api/owner/markers/[...path]';
import { clearOwnerStore } from '../../lib/owner/store';

function createResponse() {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };

  return res;
}

async function request(method: string, path: string[]) {
  const req = { method, query: { path } };
  const res = createResponse();

  await handler(req as any, res as any);

  return res;
}

describe('owner marker API mocks', () => {
  beforeEach(() => {
    clearOwnerStore();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns marker data from the owner-web dev server', async () => {
    const res = await request('GET', ['ABC123']);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      marker: { code: 'ABC123' },
      report: { status: 'reported' },
      declaration: null,
    });
  });

  it('supports temporary unlock, final unlock, and coupon listing', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-20T09:00:00.000Z'));

    const temp = await request('POST', ['ABC123', 'unlock-temp']);
    expect(temp.statusCode).toBe(200);
    expect(temp.body).toMatchObject({ status: 'temporary' });
    expect(new Date((temp.body as any).expiresAt).getTime()).toBe(
      new Date((temp.body as any).declaredAt).getTime() + 24 * 60 * 60 * 1000
    );

    jest.setSystemTime(new Date('2026-04-20T09:20:00.000Z'));

    const eligible = await request('POST', [
      'ABC123',
      '__test__',
      'set-eligible-past',
    ]);
    expect(eligible.statusCode).toBe(200);

    const final = await request('POST', ['ABC123', 'unlock-final']);
    expect(final.statusCode).toBe(200);
    expect(final.body).toMatchObject({ status: 'resolved' });

    const coupons = await request('GET', ['ABC123', 'coupons']);
    expect(coupons.statusCode).toBe(200);
    expect(coupons.body).toMatchObject({
      coupons: [{ name: '商店街応援クーポン' }],
    });
  });

  it('rejects final unlock after expiry in the mock API', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-20T09:00:00.000Z'));

    const temp = await request('POST', ['EXPIRED-001', 'unlock-temp']);
    expect(temp.statusCode).toBe(200);

    jest.setSystemTime(new Date('2026-04-21T09:00:01.000Z'));

    const final = await request('POST', ['EXPIRED-001', 'unlock-final']);
    expect(final.statusCode).toBe(400);
    expect(final.body).toEqual({
      error: '仮解除の有効期限（24時間）が切れています。再度仮解除を行ってください',
    });
  });
});
