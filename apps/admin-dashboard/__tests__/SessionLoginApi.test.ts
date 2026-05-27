import loginHandler from '../pages/api/session/login';
import collectionResultHandler from '../pages/api/session/reports/collection-result';

describe('session login API', () => {
  it('forwards login requests to the backend auth endpoint', async () => {
    const originalFetch = global.fetch;
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ accessToken: 'test-token' }),
    } as Response);
    global.fetch = fetchMock;

    const req = {
      method: 'POST',
      body: {
        email: 'admin@example.test',
        password: 'password123',
        next: '/unresolved',
      },
    };

    const res = createMockResponse();

    await loginHandler(req as never, res as never);

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/auth/login',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
      }),
    );
    expect(res.statusCode).toBe(200);
    expect(res.jsonBody).toEqual({
      ok: true,
      redirectTo: '/unresolved',
    });
    expect(String(res.headers['Set-Cookie'])).toContain('admin_access_token=');

    global.fetch = originalFetch;
  });

  it('forwards collection result requests to the backend reports endpoint', async () => {
    const originalFetch = global.fetch;
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 'R-003', status: 'collected' }),
    } as Response);
    global.fetch = fetchMock;

    const req = {
      method: 'PATCH',
      headers: {
        cookie: 'admin_access_token=test-token',
      },
      body: {
        id: 'R-003',
        result: 'collected',
        notes: '回収完了',
      },
    };

    const res = createMockResponse();

    await collectionResultHandler(req as never, res as never);

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/reports/R-003/collection-result',
      expect.objectContaining({
        method: 'PATCH',
        headers: {
          authorization: 'Bearer test-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          result: 'collected',
          notes: '回収完了',
        }),
      }),
    );
    expect(res.statusCode).toBe(200);
    expect(res.jsonBody).toEqual({ id: 'R-003', status: 'collected' });

    global.fetch = originalFetch;
  });

  it('returns unauthorized when collection result request has no session token', async () => {
    const req = {
      method: 'PATCH',
      headers: {},
      body: {
        id: 'R-003',
        result: 'collected',
      },
    };
    const res = createMockResponse();

    await collectionResultHandler(req as never, res as never);

    expect(res.statusCode).toBe(401);
    expect(res.jsonBody).toEqual({ error: 'Unauthorized' });
  });

  it('returns bad request when collection result request has no report id', async () => {
    const req = {
      method: 'PATCH',
      headers: {
        cookie: 'admin_access_token=test-token',
      },
      body: {
        result: 'collected',
      },
    };
    const res = createMockResponse();

    await collectionResultHandler(req as never, res as never);

    expect(res.statusCode).toBe(400);
    expect(res.jsonBody).toEqual({ error: 'report id required' });
  });

  it('clears the session cookie when the backend rejects collection result auth', async () => {
    const originalFetch = global.fetch;
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Unauthorized' }),
    } as Response);
    global.fetch = fetchMock;

    const req = {
      method: 'PATCH',
      headers: {
        cookie: 'admin_access_token=test-token',
      },
      body: {
        id: 'R-003',
        result: 'collected',
      },
    };
    const res = createMockResponse();

    await collectionResultHandler(req as never, res as never);

    expect(res.statusCode).toBe(401);
    expect(res.jsonBody).toEqual({ error: 'Unauthorized' });
    expect(String(res.headers['Set-Cookie'])).toContain('Max-Age=0');

    global.fetch = originalFetch;
  });

  it('returns backend request failed when collection result proxy throws unexpectedly', async () => {
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockRejectedValue(new Error('network down'));

    const req = {
      method: 'PATCH',
      headers: {
        cookie: 'admin_access_token=test-token',
      },
      body: {
        id: 'R-003',
        result: 'collected',
      },
    };
    const res = createMockResponse();

    await collectionResultHandler(req as never, res as never);

    expect(res.statusCode).toBe(500);
    expect(res.jsonBody).toEqual({ error: 'Backend request failed' });

    global.fetch = originalFetch;
  });
});

function createMockResponse() {
  const response = {
    statusCode: 200,
    headers: {} as Record<string, string | string[]>,
    jsonBody: undefined as unknown,
    setHeader(name: string, value: string | string[]) {
      this.headers[name] = value;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.jsonBody = payload;
      return this;
    },
  };

  return response;
}
