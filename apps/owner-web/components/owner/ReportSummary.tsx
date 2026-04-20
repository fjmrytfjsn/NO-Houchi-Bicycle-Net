import type { Report } from '../../lib/owner/types';

interface ReportSummaryProps {
  report?: Report;
}

export function ReportSummary({ report }: ReportSummaryProps) {
  return (
    <>
      <div>
        <strong>ステータス:</strong> {report?.status || '未報告'}
      </div>
      <div>
        <strong>報告画像:</strong>
        <div>
          {report?.imageUrl ? (
            <img
              src={report.imageUrl}
              alt="report"
              style={{
                width: '100%',
                maxHeight: 240,
                objectFit: 'cover',
              }}
            />
          ) : (
            <div style={{ width: '100%', height: 160, background: '#eee' }} />
          )}
        </div>
        <p>{report?.ocr_text}</p>
      </div>
    </>
  );
}
