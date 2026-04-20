import type {
  Coupon,
  Declaration,
  FinalUnlockResult,
  MarkerEntry,
} from './types';

const globalOwnerStore = globalThis as typeof globalThis & {
  _owner_store?: Record<string, MarkerEntry>;
};

const store: Record<string, MarkerEntry> =
  globalOwnerStore._owner_store || (globalOwnerStore._owner_store = {});

function createMarkerEntry(code: string): MarkerEntry {
  return {
    marker: { code },
    report: {
      id: `r-${code}`,
      status: 'reported',
      imageUrl: '/samples/放置自転車.jpg',
      ocr_text: '',
    },
    declaration: null,
  };
}

export function clearOwnerStore() {
  Object.keys(store).forEach((code) => {
    delete store[code];
  });
}

export function getMarkerEntry(code: string) {
  store[code] = store[code] || createMarkerEntry(code);
  return store[code];
}

export function declareTemporaryUnlock(code: string) {
  const now = new Date();
  const declaration: Declaration = {
    declaredAt: now.toISOString(),
    eligibleFinalAt: new Date(now.getTime() + 15 * 60 * 1000).toISOString(),
    expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    status: 'temporary',
  };

  const entry = getMarkerEntry(code);
  entry.declaration = declaration;
  entry.report.status = 'temporary';
  store[code] = entry;

  return declaration;
}

export function setEligibleFinalAtInPast(code: string) {
  const entry = store[code];
  if (!entry?.declaration) return null;

  entry.declaration.eligibleFinalAt = new Date(0).toISOString();
  store[code] = entry;

  return entry.declaration;
}

export function finalizeUnlock(code: string): FinalUnlockResult {
  const entry = store[code];

  if (!entry?.declaration) {
    throw new Error('no declaration found');
  }

  const now = new Date();
  const eligibleAt = new Date(entry.declaration.eligibleFinalAt).getTime();

  if (now.getTime() < eligibleAt) {
    throw new Error('eligibleFinalAt has not arrived');
  }

  entry.declaration.status = 'finalized';
  entry.declaration.finalizedAt = now.toISOString();
  entry.report.status = 'resolved';
  store[code] = entry;

  return {
    finalizedAt: entry.declaration.finalizedAt,
    status: 'resolved',
  };
}

export function getCouponsForMarker(code: string): Coupon[] {
  const entry = store[code];

  if (entry?.report.status !== 'resolved') {
    return [];
  }

  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 1);

  return [
    {
      name: '商店街応援クーポン',
      discount: '100円',
      discountType: 'fixed',
      expiresAt: expiresAt.toISOString(),
    },
  ];
}
