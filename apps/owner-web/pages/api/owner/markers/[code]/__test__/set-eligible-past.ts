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

  // set eligibleFinalAt to a past time so finalization is allowed in tests
  entry.declaration.eligibleFinalAt = new Date(0).toISOString();
  store[code] = entry;

  return res.status(200).json({ status: 'ok', data: entry.declaration });
}
