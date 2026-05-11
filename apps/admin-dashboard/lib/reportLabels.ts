import type { ReportStatus } from './types';

export const statusLabelMap: Record<ReportStatus, string> = {
  reported: 'reported',
  temporary: 'temporary',
  resolved: 'resolved',
  collection_requested: 'collection_requested',
  collected: 'collected',
  not_found_on_collection: 'not_found_on_collection',
};
