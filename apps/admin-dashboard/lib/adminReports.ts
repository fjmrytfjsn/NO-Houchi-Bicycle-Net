import type {
  ReportDetail,
  ReportHistoryEntry,
  ReportStatus,
} from './types';

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

type ApiReportSummary = {
  id: string;
  markerId: string;
  imageUrl: string;
  latitude: number;
  longitude: number;
  address?: string | null;
  identifierText: string;
  status: ReportStatus;
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

export function getAdminApiBaseUrl() {
  return (
    process.env.ADMIN_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    'http://localhost:3000'
  ).replace(/\/$/, '');
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
    elapsedLabel: '',
    currentStatusLabel: report.status,
    history: [],
  };
}

export function mapApiReportDetailToDetail(report: ApiReportDetail): ReportDetail {
  const mappedReport = mapApiReportSummaryToDetail(report);

  return {
    ...mappedReport,
    history: report.history.map(mapApiReportHistoryEntry),
  };
}

export async function fetchAdminReports(selectedStatus: SelectedReportStatus) {
  const response = await fetch(buildReportsUrl(selectedStatus));

  if (!response.ok) {
    throw new Error(`GET /api/reports failed: ${response.status}`);
  }

  const reports = (await response.json()) as ApiReportSummary[];
  return reports.map(mapApiReportSummaryToDetail);
}

export async function fetchAdminReport(id: string) {
  const response = await fetch(
    `${getAdminApiBaseUrl()}/api/reports/${encodeURIComponent(id)}`,
  );

  if (!response.ok) {
    throw new Error(`GET /api/reports/${id} failed: ${response.status}`);
  }

  return mapApiReportDetailToDetail((await response.json()) as ApiReportDetail);
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
