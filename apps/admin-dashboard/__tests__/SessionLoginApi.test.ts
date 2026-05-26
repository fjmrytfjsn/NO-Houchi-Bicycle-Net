import loginHandler from '../pages/api/session/login';

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
