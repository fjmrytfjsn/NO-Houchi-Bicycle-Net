import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { AppLayout } from '../components/AppLayout';
import { ReportsTable } from '../components/ReportsTable';
import { fetchAdminReports } from '../lib/adminReports';
import type { ReportDetail } from '../lib/types';

const unresolvedStatusFilters = ['reported', 'temporary'] as const;
type UnresolvedStatusFilter = (typeof unresolvedStatusFilters)[number];
type SelectedUnresolvedStatus = UnresolvedStatusFilter | 'all';

type UnresolvedPageProps = {
  reports: ReportDetail[];
  selectedStatus: SelectedUnresolvedStatus;
  errorMessage?: string;
};

export default function UnresolvedPage({
  reports,
  selectedStatus,
  errorMessage,
}: UnresolvedPageProps) {
  return (
    <AppLayout title="回収依頼候補">
      <section className="panel">
        <div className="panel-header">
          <h3>絞り込み</h3>
        </div>
        <nav className="filter-nav" aria-label="未解除状態フィルター">
          <Link
            href="/unresolved"
            className={selectedStatus === 'all' ? 'filter-link active' : 'filter-link'}
            aria-current={selectedStatus === 'all' ? 'page' : undefined}
          >
            すべて
          </Link>
          {unresolvedStatusFilters.map((status) => (
            <Link
              key={status}
              href={`/unresolved?status=${status}`}
              className={selectedStatus === status ? 'filter-link active' : 'filter-link'}
              aria-current={selectedStatus === status ? 'page' : undefined}
            >
              {status}
            </Link>
          ))}
        </nav>
      </section>
      {errorMessage ? (
        <section className="panel error-panel" role="alert">
          {errorMessage}
        </section>
      ) : (
        <ReportsTable
          reports={reports}
          showElapsed
          actionMode="collectionRequest"
        />
      )}
    </AppLayout>
  );
}

export const getServerSideProps: GetServerSideProps<UnresolvedPageProps> = async ({
  query = {},
}) => {
  const selectedStatus = normalizeSelectedUnresolvedStatus(query.status);

  try {
    const reports = await fetchAdminReports('all');
    const unresolvedReports = reports.filter((report) =>
      unresolvedStatusFilters.includes(report.status as UnresolvedStatusFilter),
    );
    const filteredReports =
      selectedStatus === 'all'
        ? unresolvedReports
        : unresolvedReports.filter((report) => report.status === selectedStatus);

    return {
      props: {
        reports: filteredReports,
        selectedStatus,
      },
    };
  } catch (error) {
    return {
      props: {
        reports: [],
        selectedStatus,
        errorMessage:
          '回収依頼候補を取得できませんでした。Backend API の起動状態を確認してください。',
      },
    };
  }
};

function normalizeSelectedUnresolvedStatus(
  status: string | string[] | undefined,
): SelectedUnresolvedStatus {
  const value = Array.isArray(status) ? status[0] : status;

  if (
    value &&
    unresolvedStatusFilters.includes(value as UnresolvedStatusFilter)
  ) {
    return value as UnresolvedStatusFilter;
  }

  return 'all';
}
