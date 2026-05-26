export type ReportStatus =
  | 'reported'
  | 'temporary'
  | 'resolved'
  | 'collection_requested'
  | 'collected'
  | 'not_found_on_collection';

export type CollectionCandidateDecision =
  | 'none'
  | 'auto'
  | 'manual_on'
  | 'manual_off';

export interface ReportHistoryEntry {
  id: string;
  timestamp: string;
  label: string;
  notes?: string;
}

export interface ReportSummaryItem {
  id: string;
  imageUrl: string;
  reportedAt: string;
  location: string;
  latitude: number;
  longitude: number;
  address?: string | null;
  mapEmbedUrl: string | null;
  mapLinkUrl: string;
  identifierText: string;
  status: ReportStatus;
  isCollectionCandidate?: boolean;
  collectionCandidateDecision?: CollectionCandidateDecision;
  collectionCandidateFlaggedAt?: string | null;
}

export interface ReportDetail extends ReportSummaryItem {
  elapsedLabel: string;
  currentStatusLabel: string;
  collectionRequestMemo?: string;
  collectionResultMemo?: string;
  history: ReportHistoryEntry[];
}
