export type ReportStatus = 'reported' | 'temporary' | 'resolved' | string;

export type DeclarationStatus = 'temporary' | 'finalized' | string;

export interface Marker {
  code: string;
}

export interface Report {
  id: string;
  status: ReportStatus;
  imageUrl: string;
  ocr_text: string;
}

export interface Declaration {
  declaredAt: string;
  eligibleFinalAt: string;
  expiresAt: string;
  status: DeclarationStatus;
  finalizedAt?: string;
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
