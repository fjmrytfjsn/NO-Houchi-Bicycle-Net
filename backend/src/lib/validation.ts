import { BadRequestError } from './errors';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const reportStatuses = [
  'reported',
  'temporary',
  'resolved',
  'collection_requested',
  'collected',
  'not_found_on_collection',
] as const;

export type ReportStatus = (typeof reportStatuses)[number];

export function normalizeOptionalString(value: string | null | undefined) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function requireNonBlankString(value: string | null | undefined, message: string) {
  const normalized = normalizeOptionalString(value);

  if (!normalized) {
    throw new BadRequestError(message);
  }

  return normalized;
}

export function validateEmail(value: string | null | undefined, fieldName = 'email') {
  const normalized = requireNonBlankString(value, `${fieldName} required`);

  if (!emailPattern.test(normalized)) {
    throw new BadRequestError(`${fieldName} must be a valid email address`);
  }

  return normalized;
}

export function validateOptionalEmail(value: string | null | undefined, fieldName = 'email') {
  const normalized = normalizeOptionalString(value);

  if (!normalized) {
    return null;
  }

  if (!emailPattern.test(normalized)) {
    throw new BadRequestError(`${fieldName} must be a valid email address`);
  }

  return normalized;
}

export function validateCoordinates(latitude: unknown, longitude: unknown) {
  if (
    typeof latitude !== 'number' ||
    typeof longitude !== 'number' ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    throw new BadRequestError('latitude and longitude must be numbers');
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw new BadRequestError('latitude and longitude must be valid coordinates');
  }

  return { latitude, longitude };
}

export function validateReportStatus(status: string | undefined) {
  if (!status) {
    return undefined;
  }

  if (reportStatuses.includes(status as ReportStatus)) {
    return status as ReportStatus;
  }

  throw new BadRequestError('status must be a valid report status');
}
