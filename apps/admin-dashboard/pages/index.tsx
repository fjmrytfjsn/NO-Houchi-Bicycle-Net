import Link from 'next/link';
import { AppLayout } from '../components/AppLayout';
import { ReportsTable } from '../components/ReportsTable';
import { SummaryCards } from '../components/SummaryCards';
import { mockReports } from '../lib/mockReports';

export default function HomePage() {
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
          <p>状態 [すべて] / 日時 [期間] / 位置</p>
        </div>
        <SummaryCards reports={mockReports} />
      </section>
      <ReportsTable reports={mockReports} />
    </AppLayout>
  );
}
