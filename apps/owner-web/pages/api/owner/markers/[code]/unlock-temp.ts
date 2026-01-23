import { NextApiRequest, NextApiResponse } from 'next';

const store: Record<string, any> =
  (global as any)._owner_store || ((global as any)._owner_store = {});

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code } = req.query as { code: string };
  if (req.method !== 'POST') return res.status(405).end();

  const now = new Date();
  const declaredAt = now.toISOString();
  const eligibleFinalAt = new Date(
    now.getTime() + 15 * 60 * 1000
  ).toISOString();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

  const declaration = {
    declaredAt,
    eligibleFinalAt,
    expiresAt,
    status: 'temporary',
  };

  const entry = store[code] || {
    marker: { code },
    report: { id: 'r-' + code, status: 'reported', imageUrl: '', ocr_text: '' },
    declaration: null,
  };
  entry.declaration = declaration;
  entry.report.status = 'temporary';
  store[code] = entry;

  res.status(200).json({ status: 'ok', data: declaration });
}
