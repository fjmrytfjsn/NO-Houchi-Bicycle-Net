import { NextApiRequest, NextApiResponse } from 'next';

// in-memory store for dev
const store: Record<string, any> = {};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code } = req.query as { code: string };
  if (req.method === 'GET') {
    // return marker + report + declaration
    const entry = store[code] || {
      marker: { code },
      report: {
        id: 'r-' + code,
        status: 'reported',
        imageUrl: '',
        ocr_text: '',
      },
      declaration: null,
    };
    return res.status(200).json({ status: 'ok', data: entry });
  }
  return res.status(405).end();
}
