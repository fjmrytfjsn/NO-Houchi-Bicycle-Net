import Link from 'next/link';
import type { ReportDetail } from '../lib/types';
import { ReportImageThumb } from './ReportImageThumb';
import { StatusBadge } from './StatusBadge';

interface ReportsTableProps {
  reports: ReportDetail[];
  showElapsed?: boolean;
  actionMode?: 'details' | 'collectionRequest';
}

export function ReportsTable({
  reports,
  showElapsed = false,
  actionMode = 'details',
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
              <td>{showElapsed ? report.reportedAt : report.location}</td>
              <td>{showElapsed ? report.elapsedLabel : report.identifierText}</td>
              <td>
                <StatusBadge status={report.status} />
              </td>
              <td>
                {actionMode === 'collectionRequest' ? (
                  <Link href={`/collection-request/${report.id}`}>
                    回収依頼へ進む
                  </Link>
                ) : (
                  <div className="inline-links">
                    <Link href={`/reports/${report.id}`}>詳細を見る</Link>
                    {['reported', 'temporary'].includes(report.status) ? (
                      <Link href="/unresolved">未解除案件へ</Link>
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
