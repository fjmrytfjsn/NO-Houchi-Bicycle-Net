import type { GetServerSideProps } from 'next';
import { AppLayout } from '../components/AppLayout';
import { ReportsTable } from '../components/ReportsTable';
import {
  fetchOverdueReportedReports,
  UNRESOLVED_REPORTED_THRESHOLD_HOURS,
} from '../lib/adminReports';
import type { ReportDetail } from '../lib/types';

type UnresolvedPageProps = {
  reports: ReportDetail[];
  errorMessage?: string;
};

export default function UnresolvedPage({
  reports,
  errorMessage,
}: UnresolvedPageProps) {
  const visibleReports = reports.filter((report) => report.status === 'reported');

  return (
    <AppLayout title="回収依頼候補">
      <section className="panel">
        <div className="panel-header">
          <h3>確認条件</h3>
        </div>
        <div className="filter-nav" aria-label="未解除案件の確認条件">
          <span className="filter-link active">対象: reported</span>
          <span className="filter-link active">
            基準: 通報から{UNRESOLVED_REPORTED_THRESHOLD_HOURS}時間超過
          </span>
        </div>
      </section>
      {errorMessage ? (
        <section className="panel error-panel" role="alert">
          {errorMessage}
        </section>
      ) : visibleReports.length === 0 ? (
        <section className="panel">
          <p className="panel-meta">24時間を超えた未解除案件はありません。</p>
        </section>
      ) : (
        <ReportsTable
          reports={visibleReports}
          showElapsed
          actionMode="collectionRequest"
        />
      )}
    </AppLayout>
  );
}

export const getServerSideProps: GetServerSideProps<UnresolvedPageProps> = async () => {
  try {
    const reports = await fetchOverdueReportedReports();

    return {
      props: {
        reports,
      },
    };
  } catch (error) {
    return {
      props: {
        reports: [],
        errorMessage:
          '回収依頼候補を取得できませんでした。Backend API の起動状態を確認してください。',
      },
    };
  }
};
