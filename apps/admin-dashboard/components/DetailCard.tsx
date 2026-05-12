import type { ReportDetail } from '../lib/types';
import { ReportImageThumb } from './ReportImageThumb';
import { StatusBadge } from './StatusBadge';

interface DetailCardProps {
  report: ReportDetail;
}

export function DetailCard({ report }: DetailCardProps) {
  return (
    <section className="detail-card">
      <div className="detail-grid">
        <div>
          <p className="section-label">写真</p>
          <ReportImageThumb alt={`${report.id} の写真`} imageUrl={report.imageUrl} />
        </div>
        <div className="detail-list">
          <div>
            <span>通報日時</span>
            <strong>{report.reportedAt}</strong>
          </div>
          <div>
            <span>位置</span>
            <strong>{report.location}</strong>
          </div>
          <div>
            <span>識別情報</span>
            <strong>{report.identifierText}</strong>
          </div>
          <div>
            <span>現在ステータス</span>
            <strong>
              <StatusBadge status={report.status} />
            </strong>
          </div>
        </div>
      </div>
    </section>
  );
}
