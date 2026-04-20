import { NextApiRequest, NextApiResponse } from 'next';
import { setEligibleFinalAtInPast } from '../../../../../../lib/owner/store';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code } = req.query as { code: string };
  if (req.method !== 'POST') return res.status(405).end();

  const declaration = setEligibleFinalAtInPast(code);
  if (!declaration)
    return res
      .status(400)
      .json({
        status: 'error',
        error: { code: 'no_declaration', message: 'no declaration' },
      });

  return res.status(200).json({ status: 'ok', data: declaration });
}
