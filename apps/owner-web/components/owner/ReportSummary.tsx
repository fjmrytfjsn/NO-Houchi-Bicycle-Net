import type { Declaration, Report, ReportStatus } from '../../lib/owner/types';
import styles from './ReportSummary.module.css';

interface ReportSummaryProps {
  report?: Report;
  declaration?: Declaration | null;
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  reported: { label: '通報済み', className: styles.badgeReported },
  temporary: { label: '仮解除中', className: styles.badgeTemporary },
  resolved: { label: '解除済み', className: styles.badgeResolved },
};

function getStatusInfo(status?: ReportStatus) {
  if (!status) return { label: '未報告', className: styles.badgeDefault };
  return STATUS_MAP[status] || { label: status, className: styles.badgeDefault };
}

function getEffectiveStatus(report?: Report, declaration?: Declaration | null): ReportStatus | undefined {
  if (!declaration) return report?.status;
  if (declaration.status === 'finalized' || declaration.status === 'resolved') return 'resolved';
  if (declaration.status === 'temporary') return 'temporary';
  return report?.status;
}

export function ReportSummary({ report, declaration }: ReportSummaryProps) {
  const effectiveStatus = getEffectiveStatus(report, declaration);
  const statusInfo = getStatusInfo(effectiveStatus);

  return (
    <div className={styles.card}>
      <div className={styles.imageWrap}>
        {report?.imageUrl ? (
          <img
            src={report.imageUrl}
            alt="通報された自転車の写真"
            className={styles.image}
          />
        ) : (
          <div className={styles.imagePlaceholder}>
            <span className={styles.placeholderIcon}>📷</span>
            <span className={styles.placeholderText}>画像なし</span>
          </div>
        )}
      </div>

      <div className={styles.content}>
        <div className={styles.statusRow}>
          <span className={styles.statusLabel}>現在の状態</span>
          <span className={`${styles.badge} ${statusInfo.className}`}>
            {statusInfo.label}
          </span>
        </div>

        {report?.identifierText && (
          <p className={styles.ocrText} style={{ fontSize: 'var(--text-xs)', marginTop: 'var(--space-1)' }}>
            {report.identifierText}
          </p>
        )}
      </div>
    </div>
  );
}
