import { AppLayout } from '../components/AppLayout';
import { ReportsTable } from '../components/ReportsTable';
import { unresolvedReports } from '../lib/mockReports';

export default function UnresolvedPage() {
  return (
    <AppLayout
      title="未解除案件"
      description="reported または temporary の案件を回収依頼候補として確認します。"
    >
      <section className="panel">
        <div className="panel-header">
          <h3>絞り込み</h3>
          <p>reported / temporary</p>
        </div>
      </section>
      <ReportsTable
        reports={unresolvedReports}
        showElapsed
        actionMode="collectionRequest"
      />
    </AppLayout>
  );
}
