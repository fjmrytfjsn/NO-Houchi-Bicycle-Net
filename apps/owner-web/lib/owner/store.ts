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

function getExpiryFromDeclaredAt(declaredAt: Date) {
  return new Date(declaredAt.getTime() + 24 * 60 * 60 * 1000);
}

function createMarkerEntry(code: string): MarkerEntry {
  return {
    marker: { code },
    report: {
      id: `r-${code}`,
      markerId: `m-${code}`,
      status: 'reported',
      imageUrl: '/samples/放置自転車.jpg',
      latitude: 0,
      longitude: 0,
      address: null,
      identifierText: '',
      notes: null,
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

export function updateReportData(code: string, latitude: number, longitude: number) {
  const entry = getMarkerEntry(code);
  entry.report.latitude = latitude;
  entry.report.longitude = longitude;
  entry.report.createdAt = new Date().toISOString();
  
  // 簡易的に緯度経度からダミーの位置識別情報を生成
  entry.report.identifierText = `電柱: ${Math.floor(Math.abs(latitude * 100))}-${Math.floor(Math.abs(longitude * 100))}`;
  entry.report.address = `ダミー住所 (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
  
  store[code] = entry;
  return entry;
}

export function declareTemporaryUnlock(code: string) {
  const now = new Date();
  const eligibleFinalAt = new Date(now.getTime() + 15 * 60 * 1000);
  const declaration: Declaration = {
    declaredAt: now.toISOString(),
    eligibleFinalAt: eligibleFinalAt.toISOString(),
    expiresAt: getExpiryFromDeclaredAt(now).toISOString(),
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

  const now = new Date();
  const declaredAt = new Date(entry.declaration.declaredAt);
  entry.declaration.eligibleFinalAt = now.toISOString();
  entry.declaration.expiresAt = getExpiryFromDeclaredAt(declaredAt).toISOString();
  store[code] = entry;

  return entry.declaration;
}

export function resetMarkerEntry(code: string) {
  const entry = store[code];
  if (!entry) return;

  entry.declaration = null;
  entry.report.status = 'reported';
  store[code] = entry;
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

  if (now.getTime() > new Date(entry.declaration.expiresAt).getTime()) {
    entry.declaration.status = 'expired';
    store[code] = entry;
    throw new Error('仮解除の有効期限（24時間）が切れています。再度仮解除を行ってください');
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
