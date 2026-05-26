import type { NextApiRequest, NextApiResponse } from 'next';
import { clearAdminSessionCookie } from '../../../lib/adminSession';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ ok?: boolean; error?: string }>,
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  res.setHeader('Set-Cookie', clearAdminSessionCookie());
  return res.status(200).json({ ok: true });
}
