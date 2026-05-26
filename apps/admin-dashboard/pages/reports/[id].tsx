import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { AppLayout } from '../../components/AppLayout';
import { DetailCard } from '../../components/DetailCard';
import { HistoryList } from '../../components/HistoryList';
import { fetchAdminReport } from '../../lib/adminReports';
import { withAdminPageAuth } from '../../lib/adminSession';
import type { ReportDetail } from '../../lib/types';

type ReportDetailPageProps = {
  report?: ReportDetail;
  errorMessage?: string;
};

export default function ReportDetailPage({
  report: reportFromProps,
  errorMessage,
}: ReportDetailPageProps = {}) {
  const router = useRouter();
  const isReady = router.isReady ?? true;
  const report = reportFromProps;

  if (!isReady) {
    return (
      <AppLayout title="通報詳細">
        <section className="panel">
          <p>読み込み中…</p>
        </section>
      </AppLayout>
    );
  }

  if (errorMessage || !report) {
    return (
      <AppLayout title="通報詳細">
        <section className="panel">
          <p>{errorMessage ?? '対象の通報が見つかりません。'}</p>
        </section>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="通報詳細"
      actions={
        <div className="header-links">
          {['reported', 'temporary'].includes(report.status) ? (
            <Link href="/unresolved">回収依頼候補として確認</Link>
          ) : null}
          {report.status === 'collection_requested' ? (
            <Link href={`/collection-result/${report.id}`}>回収結果記録へ</Link>
          ) : null}
        </div>
      }
    >
      <DetailCard report={report} />
      <HistoryList history={report.history} />
    </AppLayout>
  );
}

export const getServerSideProps: GetServerSideProps<ReportDetailPageProps> = async ({
  params,
  ...context
}) => {
  const id = typeof params?.id === 'string' ? params.id : undefined;

  if (!id) {
    return {
      props: {
        errorMessage: '対象の通報が見つかりません。',
      },
    };
  }

  return withAdminPageAuth<ReportDetailPageProps>(
    {
      params,
      ...context,
    } as never,
    async (token) => {
      try {
        const report = await fetchAdminReport(id, token);

        return {
          props: {
            report,
          },
        };
      } catch (error) {
        if (error instanceof Error && error.name === 'AdminSessionUnauthorizedError') {
          throw error;
        }
        return {
          props: {
            errorMessage:
              '通報詳細を取得できませんでした。Backend API の起動状態を確認してください。',
          },
        };
      }
    },
  );
};
