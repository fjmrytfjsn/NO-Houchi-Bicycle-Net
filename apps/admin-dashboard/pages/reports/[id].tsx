import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { AppLayout } from '../../components/AppLayout';
import { DetailCard } from '../../components/DetailCard';
import { HistoryList } from '../../components/HistoryList';
import { fetchAdminReport } from '../../lib/adminReports';
import { getReportById } from '../../lib/mockReports';
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
  const report = reportFromProps ?? (isReady ? getReportById(router.query.id) : undefined);

  if (!isReady) {
    return (
      <AppLayout
        title="通報詳細"
        description="写真、位置、識別情報、現在ステータス、履歴を確認します。"
      >
        <section className="panel">
          <p>読み込み中…</p>
        </section>
      </AppLayout>
    );
  }

  if (errorMessage || !report) {
    return (
      <AppLayout
        title="通報詳細"
        description="対象の通報情報が見つかりませんでした。"
      >
        <section className="panel">
          <p>{errorMessage ?? '対象の通報が見つかりません。'}</p>
        </section>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="通報詳細"
      description="写真、位置、識別情報、現在ステータス、履歴を確認します。"
      actions={
        <div className="header-links">
          {['reported', 'temporary'].includes(report.status) ? (
            <Link href="/unresolved">未解除案件として確認</Link>
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
}) => {
  const id = typeof params?.id === 'string' ? params.id : undefined;

  if (!id) {
    return {
      props: {
        errorMessage: '対象の通報が見つかりません。',
      },
    };
  }

  try {
    const report = await fetchAdminReport(id);

    return {
      props: {
        report,
      },
    };
  } catch (error) {
    return {
      props: {
        errorMessage:
          '通報詳細を取得できませんでした。Backend API の起動状態を確認してください。',
      },
    };
  }
};
