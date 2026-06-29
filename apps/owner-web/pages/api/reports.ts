import type { NextApiRequest, NextApiResponse } from 'next';
import { updateReportData } from '../../../lib/owner/store';

export const config = {
  api: {
    bodyParser: false,
  },
};

const readRawBody = (req: NextApiRequest): Promise<string> => {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      resolve(body);
    });
    req.on('error', reject);
  });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rawBody = await readRawBody(req);
  
  let marker_code = '';
  let latitude = '';
  let longitude = '';

  try {
    const latMatch = rawBody.match(/name="latitude"\s*\r\n\r\n([^\r\n]+)/);
    const lngMatch = rawBody.match(/name="longitude"\s*\r\n\r\n([^\r\n]+)/);
    const codeMatch = rawBody.match(/name="marker_code"\s*\r\n\r\n([^\r\n]+)/);
    
    if (latMatch) latitude = latMatch[1];
    if (lngMatch) longitude = lngMatch[1];
    if (codeMatch) marker_code = codeMatch[1];
  } catch (e) {
    // ignore
  }

  if (!marker_code) {
    return res.status(400).json({ error: 'marker_code is required' });
  }

  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);

  if (isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({ error: 'invalid latitude or longitude' });
  }

  const entry = updateReportData(marker_code, lat, lng);

  return res.status(200).json({
    id: entry.report.id,
    message: 'Report received successfully (Mock)',
    latitude: lat,
    longitude: lng
  });
}
