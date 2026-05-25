export type ReportStatus = 'reported' | 'temporary' | 'resolved' | string;

export type DeclarationStatus = 'temporary' | 'finalized' | 'resolved' | 'expired' | string;

export interface Marker {
  code: string;
}

export interface Report {
  id: string;
  markerId: string;
  status: ReportStatus;
  imageUrl: string;
  latitude: number;
  longitude: number;
  address?: string | null;
  identifierText: string;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Declaration {
  id?: string;
  markerId?: string;
  declaredAt: string;
  eligibleFinalAt: string;
  expiresAt: string;
  status: DeclarationStatus;
  finalizedAt?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface MarkerEntry {
  marker: Marker;
  report: Report;
  declaration: Declaration | null;
}

export interface Coupon {
  name: string;
  discount: string;
  discountType: 'fixed' | 'percentage' | string;
  expiresAt?: string;
}

export interface FinalUnlockResult {
  finalizedAt: string;
  status: 'resolved';
}
