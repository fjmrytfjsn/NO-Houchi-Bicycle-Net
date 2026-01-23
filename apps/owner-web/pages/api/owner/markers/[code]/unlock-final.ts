import { NextApiRequest, NextApiResponse } from 'next';

interface Declaration {
  declaredAt: string;
  eligibleFinalAt: string;
  expiresAt: string;
  status: string;
  finalizedAt?: string;
}

interface MarkerEntry {
  marker: { code: string };
  report: {
    id: string;
    status: string;
    imageUrl: string;
    ocr_text: string;
  };
  declaration: Declaration | null;
}

const store: Record<string, MarkerEntry> = {};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.query as { code: string };

  if (!code || typeof code !== 'string') {
    return res
      .status(400)
      .json({ error: 'code parameter is required' });
  }

  const entry = store[code];

  if (!entry || !entry.declaration) {
    return res
      .status(400)
      .json({ error: 'no declaration found' });
  }

  const now = new Date();
  const eligible = new Date(entry.declaration.eligibleFinalAt).getTime();

  if (now.getTime() < eligible) {
    return res.status(400).json({
      error: 'eligibleFinalAt has not arrived',
    });
  }

  entry.declaration.status = 'finalized';
  entry.declaration.finalizedAt = now.toISOString();
  entry.report.status = 'resolved';
  store[code] = entry;

  return res.status(200).json({
    finalizedAt: entry.declaration.finalizedAt,
    status: 'resolved',
  });
}
