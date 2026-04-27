import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { AppLayout } from '../components/AppLayout';
import { ReportsTable } from '../components/ReportsTable';
import { SummaryCards } from '../components/SummaryCards';
import {
  fetchAdminReports,
  normalizeSelectedStatus,
  reportStatusFilters,
  type SelectedReportStatus,
} from '../lib/adminReports';
import type { ReportDetail } from '../lib/types';

type HomePageProps = {
  reports: ReportDetail[];
  selectedStatus: SelectedReportStatus;
  errorMessage?: string;
};

export default function HomePage({
  reports,
  selectedStatus,
  errorMessage,
}: HomePageProps) {
  return (
    <AppLayout
      title="通報一覧"
      description="全通報を状態、日時、位置で確認する起点画面です。"
      actions={
        <div className="header-links">
          <Link href="/unresolved">未解除案件へ</Link>
        </div>
      }
    >
      <section className="panel">
        <div className="panel-header">
          <h3>フィルター</h3>
          <p>状態で通報一覧を絞り込みます。</p>
        </div>
        <nav className="filter-nav" aria-label="状態フィルター">
          <Link
            href="/"
            className={selectedStatus === 'all' ? 'filter-link active' : 'filter-link'}
            aria-current={selectedStatus === 'all' ? 'page' : undefined}
          >
            すべて
          </Link>
          {reportStatusFilters.map((status) => (
            <Link
              key={status}
              href={`/?status=${status}`}
              className={selectedStatus === status ? 'filter-link active' : 'filter-link'}
              aria-current={selectedStatus === status ? 'page' : undefined}
            >
              {status}
            </Link>
          ))}
        </nav>
        <SummaryCards reports={reports} />
      </section>
      {errorMessage ? (
        <section className="panel error-panel" role="alert">
          {errorMessage}
        </section>
      ) : (
        <ReportsTable reports={reports} />
      )}
    </AppLayout>
  );
}

export const getServerSideProps: GetServerSideProps<HomePageProps> = async ({
  query,
}) => {
  const selectedStatus = normalizeSelectedStatus(query.status);

  try {
    const reports = await fetchAdminReports(selectedStatus);

    return {
      props: {
        reports,
        selectedStatus,
      },
    };
  } catch (error) {
    return {
      props: {
        reports: [],
        selectedStatus,
        errorMessage:
          '通報一覧を取得できませんでした。Backend API の起動状態を確認してください。',
      },
    };
  }
};
