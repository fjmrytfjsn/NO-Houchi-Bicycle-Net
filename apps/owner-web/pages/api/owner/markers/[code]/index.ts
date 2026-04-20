import { NextApiRequest, NextApiResponse } from 'next';
import { getMarkerEntry } from '../../../../../lib/owner/store';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.query as { code: string };

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'code parameter is required' });
  }

  return res.status(200).json(getMarkerEntry(code));
}
