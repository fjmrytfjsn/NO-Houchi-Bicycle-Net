import { NextApiRequest, NextApiResponse } from 'next';

interface Declaration {
  declaredAt: string;
  eligibleFinalAt: string;
  expiresAt: string;
  status: string;
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

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.query as { code: string };

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'code parameter is required' });
  }

  const now = new Date();
  const declaredAt = now.toISOString();
  const eligibleFinalAt = new Date(
    now.getTime() + 15 * 60 * 1000
  ).toISOString();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

  const declaration: Declaration = {
    declaredAt,
    eligibleFinalAt,
    expiresAt,
    status: 'temporary',
  };

  const entry: MarkerEntry = store[code] || {
    marker: { code },
    report: {
      id: 'r-' + code,
      status: 'reported',
      imageUrl: '',
      ocr_text: '',
    },
    declaration: null,
  };

  entry.declaration = declaration;
  entry.report.status = 'temporary';
  store[code] = entry;

  return res.status(200).json(declaration);
}
