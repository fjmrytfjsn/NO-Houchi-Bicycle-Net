import type { GetServerSideProps } from 'next';
import { AppLayout } from '../components/AppLayout';
import { ReportsTable } from '../components/ReportsTable';
import { fetchAdminReports } from '../lib/adminReports';
import type { ReportDetail } from '../lib/types';

type UnresolvedPageProps = {
  reports: ReportDetail[];
  errorMessage?: string;
};

export default function UnresolvedPage({
  reports,
  errorMessage,
}: UnresolvedPageProps) {
  return (
    <AppLayout title="回収依頼候補">
      <section className="panel">
        <div className="panel-header">
          <h3>絞り込み</h3>
          <p>reported / temporary</p>
        </div>
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

export const getServerSideProps: GetServerSideProps<UnresolvedPageProps> = async () => {
  try {
    const reports = await fetchAdminReports('all');

    return {
      props: {
        reports: reports.filter((report) =>
          ['reported', 'temporary'].includes(report.status),
        ),
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
