import type {
  Coupon,
  Declaration,
  FinalUnlockResult,
  MarkerEntry,
} from './types';

async function parseError(res: Response, fallback: string) {
  const body = await res.json().catch(() => null);
  return new Error(body?.error || fallback);
}

export async function getMarker(code: string): Promise<MarkerEntry> {
  const res = await fetch(`/api/owner/markers/${code}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch marker: ${res.statusText}`);
  }
  return res.json();
}

export async function unlockTemp(
  code: string,
  notes?: string
): Promise<Declaration> {
  const res = await fetch(`/api/owner/markers/${code}/unlock-temp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: notes ? JSON.stringify({ notes }) : undefined,
  });
  if (!res.ok) {
    throw await parseError(res, 'Failed to unlock temporarily');
  }
  return res.json();
}

export async function unlockFinal(code: string): Promise<FinalUnlockResult> {
  const res = await fetch(`/api/owner/markers/${code}/unlock-final`, {
    method: 'POST',
  });
  if (!res.ok) {
    throw await parseError(res, 'Failed to unlock finally');
  }
  return res.json();
}

export async function getCoupons(code: string): Promise<{ coupons: Coupon[] }> {
  const res = await fetch(`/api/owner/markers/${code}/coupons`);
  if (!res.ok) {
    throw new Error(`Failed to fetch coupons: ${res.statusText}`);
  }
  return res.json();
}
