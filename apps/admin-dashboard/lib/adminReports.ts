import type { ReportDetail, ReportStatus } from './types';

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

type ApiReport = {
  id: string;
  imageUrl: string;
  latitude: number;
  longitude: number;
  address?: string | null;
  identifierText: string;
  status: ReportStatus;
  createdAt: string;
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

export function mapApiReportToDetail(report: ApiReport): ReportDetail {
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

export async function fetchAdminReports(selectedStatus: SelectedReportStatus) {
  const response = await fetch(buildReportsUrl(selectedStatus));

  if (!response.ok) {
    throw new Error(`GET /api/reports failed: ${response.status}`);
  }

  const reports = (await response.json()) as ApiReport[];
  return reports.map(mapApiReportToDetail);
}

export async function fetchAdminReport(id: string) {
  const response = await fetch(
    `${getAdminApiBaseUrl()}/api/reports/${encodeURIComponent(id)}`,
  );

  if (!response.ok) {
    throw new Error(`GET /api/reports/${id} failed: ${response.status}`);
  }

  return mapApiReportToDetail((await response.json()) as ApiReport);
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
