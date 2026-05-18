import type { NextApiRequest, NextApiResponse } from 'next';
import {
  declareTemporaryUnlock,
  finalizeUnlock,
  getCouponsForMarker,
  getMarkerEntry,
  setEligibleFinalAtInPast,
} from '../../../../lib/owner/store';

function getPath(queryPath: string | string[] | undefined) {
  return Array.isArray(queryPath) ? queryPath : queryPath ? [queryPath] : [];
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const [code, action, subAction] = getPath(req.query.path);

  if (!code) {
    return res.status(400).json({ error: 'marker code is required' });
  }

  if (req.method === 'GET' && !action) {
    return res.status(200).json(getMarkerEntry(code));
  }

  if (req.method === 'POST' && action === 'unlock-temp') {
    return res.status(200).json(declareTemporaryUnlock(code));
  }

  if (req.method === 'POST' && action === 'unlock-final') {
    try {
      return res.status(200).json(finalizeUnlock(code));
    } catch (err) {
      return res.status(400).json({
        error:
          err instanceof Error ? err.message : 'failed to finalize unlock',
      });
    }
  }

  if (req.method === 'GET' && action === 'coupons') {
    return res.status(200).json({ coupons: getCouponsForMarker(code) });
  }

  if (
    req.method === 'POST' &&
    action === '__test__' &&
    subAction === 'set-eligible-past'
  ) {
    const declaration = setEligibleFinalAtInPast(code);

    if (!declaration) {
      return res.status(404).json({ error: 'declaration not found' });
    }

    return res.status(200).json(declaration);
  }

  return res.status(404).json({ error: 'not found' });
}
