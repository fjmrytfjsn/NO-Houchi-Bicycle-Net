import handler from '../pages/api/session/reports/collection-request';

describe('session collection request API', () => {
  it('forwards collection requests to the backend reports endpoint', async () => {
    const originalFetch = global.fetch;
    const fetchMock = jest.fn().mockResolvedValue({
      status: 200,
      json: async () => ({ id: 'r-1', status: 'collection_requested' }),
    } as Response);
    global.fetch = fetchMock;

    const req = {
      method: 'POST',
      headers: {
        cookie: 'admin_access_token=test-token',
      },
      body: {
        id: 'r-1',
        notes: '歩道上に継続駐輪',
      },
    };
    const res = createMockResponse();

    await handler(req as never, res as never);

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/reports/r-1/collection-request',
      expect.objectContaining({
        method: 'POST',
        headers: {
          authorization: 'Bearer test-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          notes: '歩道上に継続駐輪',
        }),
      }),
    );
    expect(res.statusCode).toBe(200);
    expect(res.jsonBody).toEqual({ id: 'r-1', status: 'collection_requested' });

    global.fetch = originalFetch;
  });

  it('returns 405 for unsupported methods', async () => {
    const req = {
      method: 'GET',
      headers: {},
      body: {},
    };
    const res = createMockResponse();

    await handler(req as never, res as never);

    expect(res.statusCode).toBe(405);
    expect(res.headers.Allow).toBe('POST');
    expect(res.jsonBody).toEqual({ error: 'Method Not Allowed' });
  });

  it('returns 401 without an admin session token', async () => {
    const req = {
      method: 'POST',
      headers: {},
      body: {
        id: 'r-1',
      },
    };
    const res = createMockResponse();

    await handler(req as never, res as never);

    expect(res.statusCode).toBe(401);
    expect(res.jsonBody).toEqual({ error: 'Unauthorized' });
  });

  it('returns 400 when the report id is missing', async () => {
    const req = {
      method: 'POST',
      headers: {
        cookie: 'admin_access_token=test-token',
      },
      body: {},
    };
    const res = createMockResponse();

    await handler(req as never, res as never);

    expect(res.statusCode).toBe(400);
    expect(res.jsonBody).toEqual({ error: 'report id required' });
  });

  it('clears the session and returns 401 when the backend rejects authorization', async () => {
    const originalFetch = global.fetch;
    const fetchMock = jest.fn().mockResolvedValue({
      status: 401,
      json: async () => ({ error: 'Unauthorized' }),
    } as Response);
    global.fetch = fetchMock;

    const req = {
      method: 'POST',
      headers: {
        cookie: 'admin_access_token=test-token',
      },
      body: {
        id: 'r-1',
      },
    };
    const res = createMockResponse();

    await handler(req as never, res as never);

    expect(res.statusCode).toBe(401);
    expect(res.jsonBody).toEqual({ error: 'Unauthorized' });
    expect(String(res.headers['Set-Cookie'])).toContain('admin_access_token=');

    global.fetch = originalFetch;
  });

  it('returns 500 when the backend request throws', async () => {
    const originalFetch = global.fetch;
    const fetchMock = jest.fn().mockRejectedValue(new Error('network error'));
    global.fetch = fetchMock;

    const req = {
      method: 'POST',
      headers: {
        cookie: 'admin_access_token=test-token',
      },
      body: {
        id: 'r-1',
      },
    };
    const res = createMockResponse();

    await handler(req as never, res as never);

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
