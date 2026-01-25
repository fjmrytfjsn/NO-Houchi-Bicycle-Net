import { NextApiRequest, NextApiResponse } from 'next';

interface MarkerEntry {
  marker: { code: string };
  report: {
    id: string;
    status: string;
    imageUrl: string;
    ocr_text: string;
  };
  declaration: any;
}

// in-memory store for dev
const store: Record<string, MarkerEntry> = {};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.query as { code: string };

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'code parameter is required' });
  }

  // Return marker + report + declaration
  const entry = store[code] || {
    marker: { code },
    report: {
      id: 'r-' + code,
      status: 'reported',
      imageUrl: '/samples/放置自転車.jpg',
      ocr_text: '',
    },
    declaration: null,
  };

  return res.status(200).json(entry);
}
