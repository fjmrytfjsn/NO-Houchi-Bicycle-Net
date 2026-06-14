import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminApiBaseUrl } from '../../../../lib/adminApiConfig';
import {
  AdminSessionUnauthorizedError,
  clearAdminSessionCookie,
  getAdminSessionToken,
} from '../../../../lib/adminSessionShared';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const token = getAdminSessionToken(req.headers.cookie);
  const id = typeof req.body?.id === 'string' ? req.body.id : undefined;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!id) {
    return res.status(400).json({ error: 'report id required' });
  }

  try {
    const response = await fetch(
      `${getAdminApiBaseUrl()}/api/reports/${encodeURIComponent(id)}/collection-request`,
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          ...(typeof req.body?.notes === 'string' ? { notes: req.body.notes } : {}),
        }),
      },
    );

    if (response.status === 401 || response.status === 403) {
      throw new AdminSessionUnauthorizedError();
    }

    const payload = await response.json().catch(() => null);
    return res.status(response.status).json(payload);
  } catch (error) {
    if (error instanceof AdminSessionUnauthorizedError) {
      res.setHeader('Set-Cookie', clearAdminSessionCookie());
      return res.status(401).json({ error: 'Unauthorized' });
    }

    return res.status(500).json({ error: 'Backend request failed' });
  }
}
