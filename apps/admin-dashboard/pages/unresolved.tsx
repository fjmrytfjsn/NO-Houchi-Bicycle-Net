import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { useEffect, useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { ReportsTable } from '../components/ReportsTable';
import {
  fetchReportedCandidateReports,
  getCollectionCandidateLabel,
  normalizeSelectedUnresolvedView,
  type SelectedUnresolvedView,
  UNRESOLVED_REPORTED_THRESHOLD_HOURS,
  updateCollectionCandidate,
} from '../lib/adminReports';
import type { ReportDetail } from '../lib/types';

type UnresolvedPageProps = {
  reports: ReportDetail[];
  selectedView: SelectedUnresolvedView;
  errorMessage?: string;
};

export default function UnresolvedPage({
  reports,
  selectedView = 'all',
  errorMessage,
}: UnresolvedPageProps) {
  const [currentReports, setCurrentReports] = useState(reports);
  const [updatingReportId, setUpdatingReportId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    setCurrentReports(reports);
    setActionError(null);
  }, [reports]);

  const visibleReports =
    selectedView === 'candidate'
      ? currentReports.filter((report) => report.isCollectionCandidate)
      : currentReports;

  async function handleCollectionCandidateToggle(report: ReportDetail, nextValue: boolean) {
    setUpdatingReportId(report.id);
    setActionError(null);

    try {
      const updatedReport = await updateCollectionCandidate(report.id, nextValue);
      setCurrentReports((previous) =>
        previous.map((entry) => (entry.id === updatedReport.id ? updatedReport : entry)),
      );
    } catch (error) {
      setActionError('回収対象フラグを更新できませんでした。Backend API の起動状態を確認してください。');
    } finally {
      setUpdatingReportId(null);
    }
  }

  return (
    <AppLayout title="回収依頼候補">
      <section className="panel">
        <div className="panel-header">
          <h3>確認条件</h3>
        </div>
        <div className="filter-nav" aria-label="未解除案件の確認条件">
          <span className="filter-link active">対象: reported</span>
          <span className="filter-link active">
            自動条件: 通報から{UNRESOLVED_REPORTED_THRESHOLD_HOURS}時間超過で回収対象
          </span>
        </div>
        <nav className="filter-nav" aria-label="回収依頼候補フィルター">
          <Link
            href="/unresolved?view=all"
            className={selectedView === 'all' ? 'filter-link active' : 'filter-link'}
            aria-current={selectedView === 'all' ? 'page' : undefined}
          >
            reported全件
          </Link>
          <Link
            href="/unresolved?view=candidate"
            className={selectedView === 'candidate' ? 'filter-link active' : 'filter-link'}
            aria-current={selectedView === 'candidate' ? 'page' : undefined}
          >
            回収対象のみ
          </Link>
        </nav>
      </section>
      {errorMessage ? (
        <section className="panel error-panel" role="alert">
          {errorMessage}
        </section>
      ) : actionError ? (
        <>
          <section className="panel error-panel" role="alert">
            {actionError}
          </section>
          {visibleReports.length === 0 ? (
            <section className="panel">
              <p className="panel-meta">
                {selectedView === 'candidate'
                  ? '回収対象の未解除案件はありません。'
                  : 'reported の未解除案件はありません。'}
              </p>
            </section>
          ) : (
            <ReportsTable
              reports={visibleReports}
              showElapsed
              actionMode="collectionRequest"
              showCollectionCandidate
              getCollectionCandidateLabel={getCollectionCandidateLabel}
              onToggleCollectionCandidate={handleCollectionCandidateToggle}
              updatingReportId={updatingReportId}
            />
          )}
        </>
      ) : visibleReports.length === 0 ? (
        <section className="panel">
          <p className="panel-meta">
            {selectedView === 'candidate'
              ? '回収対象の未解除案件はありません。'
              : 'reported の未解除案件はありません。'}
          </p>
        </section>
      ) : (
        <ReportsTable
          reports={visibleReports}
          showElapsed
          actionMode="collectionRequest"
          showCollectionCandidate
          getCollectionCandidateLabel={getCollectionCandidateLabel}
          onToggleCollectionCandidate={handleCollectionCandidateToggle}
          updatingReportId={updatingReportId}
        />
      )}
    </AppLayout>
  );
}

export const getServerSideProps: GetServerSideProps<UnresolvedPageProps> = async ({
  query = {},
}) => {
  const selectedView = normalizeSelectedUnresolvedView(query.view);

  try {
    const reports = await fetchReportedCandidateReports();

    return {
      props: {
        reports,
        selectedView,
      },
    };
  } catch (error) {
    return {
      props: {
        reports: [],
        selectedView,
        errorMessage:
          '回収依頼候補を取得できませんでした。Backend API の起動状態を確認してください。',
      },
    };
  }
};
