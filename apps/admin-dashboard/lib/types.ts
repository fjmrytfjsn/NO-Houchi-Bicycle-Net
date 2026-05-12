export type ReportStatus =
  | 'reported'
  | 'temporary'
  | 'resolved'
  | 'collection_requested'
  | 'collected'
  | 'not_found_on_collection';

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
}

export interface ReportDetail extends ReportSummaryItem {
  elapsedLabel: string;
  currentStatusLabel: string;
  collectionRequestMemo?: string;
  collectionResultMemo?: string;
  history: ReportHistoryEntry[];
}
