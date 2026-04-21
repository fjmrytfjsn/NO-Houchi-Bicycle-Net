import type { ReportStatus } from '../lib/types';
import { statusLabelMap } from '../lib/mockReports';

interface StatusBadgeProps {
  status: ReportStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`status-badge status-${status}`}>
      {statusLabelMap[status]}
    </span>
  );
}
