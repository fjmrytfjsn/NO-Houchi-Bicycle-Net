import { NextApiRequest, NextApiResponse } from 'next';

const store: Record<string, any> =
  (global as any)._owner_store || ((global as any)._owner_store = {});

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code } = req.query as { code: string };
  if (req.method !== 'POST') return res.status(405).end();

  const entry = store[code];
  if (!entry || !entry.declaration)
    return res
      .status(400)
      .json({
        status: 'error',
        error: { code: 'no_declaration', message: 'no declaration' },
      });

  const now = new Date();
  const eligible = new Date(entry.declaration.eligibleFinalAt).getTime();
  if (now.getTime() < eligible) {
    return res
      .status(400)
      .json({
        status: 'error',
        error: {
          code: 'too_early',
          message: 'eligibleFinalAt has not arrived',
        },
      });
  }

  entry.declaration.status = 'finalized';
  entry.declaration.finalizedAt = now.toISOString();
  entry.report.status = 'resolved';
  store[code] = entry;

  return res
    .status(200)
    .json({
      status: 'ok',
      data: { finalizedAt: entry.declaration.finalizedAt, status: 'resolved' },
    });
}
