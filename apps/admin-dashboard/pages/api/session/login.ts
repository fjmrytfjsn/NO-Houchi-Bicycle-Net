import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminApiBaseUrl } from '../../../lib/adminApiConfig';
import { createAdminSessionCookie, normalizeNextPath } from '../../../lib/adminSessionShared';

type LoginResponse = {
  ok?: boolean;
  error?: string;
  redirectTo?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LoginResponse>,
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const response = await fetch(`${getAdminApiBaseUrl()}/auth/login`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      email: req.body?.email,
      password: req.body?.password,
    }),
  });

  const payload = (await response.json().catch(() => null)) as
    | { accessToken?: string; error?: string }
    | null;

  if (!response.ok || !payload?.accessToken) {
    return res.status(response.status || 500).json({
      error: payload?.error ?? 'login failed',
    });
  }

  res.setHeader('Set-Cookie', createAdminSessionCookie(payload.accessToken));
  return res.status(200).json({
    ok: true,
    redirectTo: normalizeNextPath(req.body?.next),
  });
}
