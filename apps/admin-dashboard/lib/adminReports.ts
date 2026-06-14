import type {
  CollectionCandidateDecision,
  ReportDetail,
  ReportHistoryEntry,
  ReportStatus,
} from './types';
import { getAdminApiBaseUrl } from './adminApiConfig';
import { AdminSessionUnauthorizedError } from './adminSessionShared';

export const reportStatusFilters = [
  'reported',
  'temporary',
  'resolved',
  'collection_requested',
  'collected',
  'not_found_on_collection',
] as const;

export type ReportStatusFilter = (typeof reportStatusFilters)[number];
export type SelectedReportStatus = ReportStatusFilter | 'all';
export const UNRESOLVED_REPORTED_THRESHOLD_HOURS = 24;
export const unresolvedViewFilters = ['all', 'candidate'] as const;
export type SelectedUnresolvedView = (typeof unresolvedViewFilters)[number];

type ApiReportSummary = {
  id: string;
  markerId: string;
  imageUrl: string;
  latitude: number;
  longitude: number;
  address?: string | null;
  identifierText: string;
  status: ReportStatus;
  isCollectionCandidate: boolean;
  collectionCandidateDecision: CollectionCandidateDecision;
  collectionCandidateFlaggedAt: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

type ApiReportHistoryEntry = {
  id: string;
  timestamp: string;
  label: string;
  notes?: string | null;
};

type ApiReportDetail = ApiReportSummary & {
  history: ApiReportHistoryEntry[];
};

type FetchInit = NonNullable<Parameters<typeof fetch>[1]>;
type CollectionResult = 'collected' | 'not_found_on_collection';

class AdminApiRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'AdminApiRequestError';
    this.status = status;
  }
}

function buildAuthorizedRequestInit(token?: string, init: FetchInit = {}) {
  const headers: Record<string, string> = {};

  if (init.headers && !Array.isArray(init.headers) && !(init.headers instanceof Headers)) {
    Object.assign(headers, init.headers);
  }

  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  return {
    ...init,
    headers,
  };
}

async function fetchAdminApiJson<T>(url: string, token?: string, init: FetchInit = {}) {
  const response = await fetch(url, buildAuthorizedRequestInit(token, init));

  if (response.status === 401 || response.status === 403) {
    throw new AdminSessionUnauthorizedError();
  }

  if (!response.ok) {
    throw new Error(`${init.method ?? 'GET'} ${url} failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

async function fetchAdminSessionApiJson<T>(url: string, init: FetchInit = {}) {
  const response = await fetch(url, init);

  if (response.status === 401 || response.status === 403) {
    throw new AdminSessionUnauthorizedError();
  }

  const payload = (await response.json().catch(() => null)) as
    | { error?: string }
    | null;

  if (!response.ok) {
    throw new AdminApiRequestError(
      payload?.error || `${init.method ?? 'GET'} ${url} failed: ${response.status}`,
      response.status,
    );
  }

  return payload as T;
}

export function normalizeSelectedStatus(
  status: string | string[] | undefined,
): SelectedReportStatus {
  const value = Array.isArray(status) ? status[0] : status;

  if (value && reportStatusFilters.includes(value as ReportStatusFilter)) {
    return value as ReportStatusFilter;
  }

  return 'all';
}

export function buildReportsUrl(selectedStatus: SelectedReportStatus) {
  const url = new URL('/api/reports', getAdminApiBaseUrl());

  if (selectedStatus !== 'all') {
    url.searchParams.set('status', selectedStatus);
  }

  return url.toString();
}

export function mapApiReportSummaryToDetail(report: ApiReportSummary): ReportDetail {
  return mapApiReportSummaryToDetailWithNow(report);
}

export function mapApiReportSummaryToDetailWithNow(
  report: ApiReportSummary,
  now?: Date,
): ReportDetail {
  const location = report.address ?? formatLocation(report.latitude, report.longitude);

  return {
    id: report.id,
    imageUrl: report.imageUrl,
    reportedAt: formatDateTime(report.createdAt),
    location,
    latitude: report.latitude,
    longitude: report.longitude,
    address: report.address ?? null,
    mapEmbedUrl: buildMapEmbedUrl(report.latitude, report.longitude),
    mapLinkUrl: buildMapLinkUrl(report.latitude, report.longitude),
    identifierText: report.identifierText,
    status: report.status,
    elapsedLabel: now ? formatElapsedTime(report.createdAt, now) : '',
    currentStatusLabel: report.status,
    isCollectionCandidate: report.isCollectionCandidate,
    collectionCandidateDecision: report.collectionCandidateDecision,
    collectionCandidateFlaggedAt: report.collectionCandidateFlaggedAt,
    history: [],
  };
}

export function mapApiReportDetailToDetail(report: ApiReportDetail): ReportDetail {
  const mappedReport = mapApiReportSummaryToDetailWithNow(report);

  return {
    ...mappedReport,
    history: report.history.map(mapApiReportHistoryEntry),
  };
}

export async function fetchAdminReports(selectedStatus: SelectedReportStatus, token?: string) {
  const reports = await fetchAdminApiJson<ApiReportSummary[]>(
    buildReportsUrl(selectedStatus),
    token,
  );
  return reports.map(mapApiReportSummaryToDetail);
}

export async function fetchReportedCandidateReports(now: Date = new Date(), token?: string) {
  const reports = await fetchAdminApiJson<ApiReportSummary[]>(
    buildReportsUrl('reported'),
    token,
  );

  return reports
    .filter((report) => report.status === 'reported')
    .map((report) => mapApiReportSummaryToDetailWithNow(report, now));
}

export async function fetchAdminReport(id: string, token?: string) {
  return mapApiReportDetailToDetail(
    await fetchAdminApiJson<ApiReportDetail>(
      `${getAdminApiBaseUrl()}/api/reports/${encodeURIComponent(id)}`,
      token,
    ),
  );
}

export async function updateCollectionCandidate(
  id: string,
  isCollectionCandidate: boolean,
  now: Date = new Date(),
) {
  const updatedReport = await fetchAdminApiJson<ApiReportSummary>(
    `/api/session/reports/collection-candidate`,
    undefined,
    {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ id, isCollectionCandidate }),
    },
  );
  return mapApiReportSummaryToDetailWithNow(updatedReport, now);
}

export async function requestCollection(id: string, notes?: string, now: Date = new Date()) {
  const updatedReport = await fetchAdminApiJson<ApiReportSummary>(
    `/api/session/reports/collection-request`,
    undefined,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        id,
        ...(notes ? { notes } : {}),
      }),
    },
  );
  return mapApiReportSummaryToDetailWithNow(updatedReport, now);
}

export async function recordCollectionResult(
  id: string,
  result: CollectionResult,
  notes?: string,
) {
  const updatedReport = await fetchAdminSessionApiJson<ApiReportSummary>(
    `/api/session/reports/collection-result`,
    {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ id, result, notes: notes ?? '' }),
    },
  );

  return mapApiReportSummaryToDetail(updatedReport);
}

export function normalizeSelectedUnresolvedView(
  value: string | string[] | undefined,
): SelectedUnresolvedView {
  const normalized = Array.isArray(value) ? value[0] : value;

  if (normalized && unresolvedViewFilters.includes(normalized as SelectedUnresolvedView)) {
    return normalized as SelectedUnresolvedView;
  }

  return 'all';
}

export function getCollectionCandidateLabel(report: ReportDetail) {
  if (report.collectionCandidateDecision === 'manual_off') {
    return '手動除外';
  }

  if (!report.isCollectionCandidate) {
    return '未対象';
  }

  if (report.collectionCandidateDecision === 'manual_on') {
    return '回収対象（手動）';
  }

  return '回収対象（自動）';
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .format(date)
    .replace(/\//g, '-');
}

function formatLocation(latitude: number, longitude: number) {
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

function buildMapLinkUrl(latitude: number, longitude: number) {
  const url = new URL('https://www.google.com/maps');
  url.searchParams.set('q', `${latitude},${longitude}`);
  return url.toString();
}

function buildMapEmbedUrl(latitude: number, longitude: number) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return null;
  }

  const url = new URL('https://www.google.com/maps/embed/v1/place');
  url.searchParams.set('key', apiKey);
  url.searchParams.set('q', `${latitude},${longitude}`);
  return url.toString();
}

function mapApiReportHistoryEntry(entry: ApiReportHistoryEntry): ReportHistoryEntry {
  return {
    id: entry.id,
    timestamp: formatDateTime(entry.timestamp),
    label: entry.label,
    ...(entry.notes ? { notes: entry.notes } : {}),
  };
}

function formatElapsedTime(createdAt: string, now: Date) {
  const createdAtDate = new Date(createdAt);

  if (Number.isNaN(createdAtDate.getTime())) {
    return '';
  }

  const elapsedHours = getElapsedHours(createdAtDate, now);
  const days = Math.floor(elapsedHours / 24);
  const hours = elapsedHours % 24;

  if (days === 0) {
    return `${hours}時間`;
  }

  if (hours === 0) {
    return `${days}日`;
  }

  return `${days}日 ${hours}時間`;
}

function getElapsedHours(createdAt: Date, now: Date) {
  const diffMs = now.getTime() - createdAt.getTime();

  if (diffMs <= 0) {
    return 0;
  }

  return Math.floor(diffMs / (1000 * 60 * 60));
}
