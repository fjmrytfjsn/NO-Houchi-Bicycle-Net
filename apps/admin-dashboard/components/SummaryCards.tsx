import type { ReportDetail } from '../lib/types';

interface SummaryCardsProps {
  reports: ReportDetail[];
}

export function SummaryCards({ reports }: SummaryCardsProps) {
  const unresolvedCount = reports.filter((report) =>
    ['reported', 'temporary'].includes(report.status),
  ).length;
  const collectionRequestedCount = reports.filter(
    (report) => report.status === 'collection_requested',
  ).length;

  return (
    <section aria-label="サマリー" className="summary-grid">
      <article className="summary-card">
        <span className="summary-label">全件</span>
        <strong>{reports.length}</strong>
      </article>
      <article className="summary-card">
        <span className="summary-label">未解除</span>
        <strong>{unresolvedCount}</strong>
      </article>
      <article className="summary-card">
        <span className="summary-label">回収依頼中</span>
        <strong>{collectionRequestedCount}</strong>
      </article>
    </section>
  );
}
