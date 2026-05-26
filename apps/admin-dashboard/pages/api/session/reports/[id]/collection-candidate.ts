import type { NextApiRequest, NextApiResponse } from 'next';
import {
  AdminSessionUnauthorizedError,
  appendResponseCookie,
  clearAdminSessionCookie,
  getAdminSessionToken,
} from '../../../../../lib/adminSession';
import { getAdminApiBaseUrl } from '../../../../../lib/adminReports';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    res.setHeader('Allow', 'PATCH');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const token = getAdminSessionToken(req.headers.cookie);

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const response = await fetch(
      `${getAdminApiBaseUrl()}/api/reports/${encodeURIComponent(String(req.query.id))}/collection-candidate`,
      {
        method: 'PATCH',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          isCollectionCandidate: req.body?.isCollectionCandidate,
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
      appendResponseCookie(res, clearAdminSessionCookie());
      return res.status(401).json({ error: 'Unauthorized' });
    }

    return res.status(500).json({ error: 'Backend request failed' });
  }
}
