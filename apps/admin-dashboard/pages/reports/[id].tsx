import Link from 'next/link';
import { useRouter } from 'next/router';
import { AppLayout } from '../../components/AppLayout';
import { DetailCard } from '../../components/DetailCard';
import { HistoryList } from '../../components/HistoryList';
import { getReportById } from '../../lib/mockReports';

export default function ReportDetailPage() {
  const router = useRouter();
  const report = getReportById(router.query.id);

  if (!report) {
    return (
      <AppLayout
        title="通報詳細"
        description="対象の通報情報が見つかりませんでした。"
      >
        <section className="panel">
          <p>対象の通報が見つかりません。</p>
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
