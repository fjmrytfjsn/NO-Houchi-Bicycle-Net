import type { ReportHistoryEntry } from '../lib/types';

interface HistoryListProps {
  history: ReportHistoryEntry[];
}

export function HistoryList({ history }: HistoryListProps) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h3>履歴</h3>
      </div>
      <ul className="history-list">
        {history.map((entry) => (
          <li key={entry.id}>
            <div>
              <strong>{entry.label}</strong>
              <span>{entry.timestamp}</span>
            </div>
            {entry.notes ? <p>{entry.notes}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
