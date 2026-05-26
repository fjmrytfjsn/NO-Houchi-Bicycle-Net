import Link from 'next/link';
import type { ReportDetail } from '../lib/types';
import { ReportImageThumb } from './ReportImageThumb';
import { StatusBadge } from './StatusBadge';

interface ReportsTableProps {
  reports: ReportDetail[];
  showElapsed?: boolean;
  actionMode?: 'details' | 'collectionRequest';
  showCollectionCandidate?: boolean;
  // eslint-disable-next-line no-unused-vars
  getCollectionCandidateLabel?: (report: ReportDetail) => string;
  // eslint-disable-next-line no-unused-vars
  onToggleCollectionCandidate?: (report: ReportDetail, nextValue: boolean) => void;
  updatingReportId?: string | null;
}

export function ReportsTable({
  reports,
  showElapsed = false,
  actionMode = 'details',
  showCollectionCandidate = false,
  getCollectionCandidateLabel,
  onToggleCollectionCandidate,
  updatingReportId = null,
}: ReportsTableProps) {
  return (
    <div className="table-card">
      <table className="reports-table">
        <thead>
          <tr>
            <th>写真</th>
            <th>{showElapsed ? '識別情報' : '通報日時'}</th>
            <th>{showElapsed ? '通報日時' : '位置'}</th>
            <th>{showElapsed ? '経過時間' : '識別情報'}</th>
            <th>{showElapsed ? '現在ステータス' : '状態'}</th>
            {showCollectionCandidate ? <th>回収対象</th> : null}
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr key={report.id}>
              <td>
                <ReportImageThumb
                  alt={`${report.id} の写真サムネイル`}
                  imageUrl={report.imageUrl}
                />
              </td>
              <td>{showElapsed ? report.identifierText : report.reportedAt}</td>
              <td>
                {showElapsed ? (
                  report.reportedAt
                ) : (
                  <div className="location-cell">
                    <span>{report.address ?? report.location}</span>
                    <a href={report.mapLinkUrl} target="_blank" rel="noreferrer">
                      Google Mapsで開く
                    </a>
                  </div>
                )}
              </td>
              <td>{showElapsed ? report.elapsedLabel : report.identifierText}</td>
              <td>
                <StatusBadge status={report.status} />
              </td>
              {showCollectionCandidate ? (
                <td>{getCollectionCandidateLabel ? getCollectionCandidateLabel(report) : '-'}</td>
              ) : null}
              <td>
                {actionMode === 'collectionRequest' ? (
                  <div className="inline-links">
                    {onToggleCollectionCandidate ? (
                      <button
                        type="button"
                        onClick={() =>
                          onToggleCollectionCandidate(report, !report.isCollectionCandidate)
                        }
                        disabled={updatingReportId === report.id}
                      >
                        {report.isCollectionCandidate ? '回収対象から外す' : '回収対象にする'}
                      </button>
                    ) : null}
                    {report.isCollectionCandidate ? (
                      <Link href={`/collection-request/${report.id}`}>
                        回収依頼へ進む
                      </Link>
                    ) : null}
                  </div>
                ) : (
                  <div className="inline-links">
                    <Link href={`/reports/${report.id}`}>詳細を見る</Link>
                    {['reported', 'temporary'].includes(report.status) ? (
                      <Link href="/unresolved">回収依頼候補へ</Link>
                    ) : null}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
