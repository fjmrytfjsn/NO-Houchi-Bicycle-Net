import styles from './StatusMessages.module.css';

interface StatusMessagesProps {
  loading: boolean;
  error: string | null;
  info: string | null;
  hasData: boolean;
}

export function StatusMessages({
  loading,
  error,
  info,
  hasData,
}: StatusMessagesProps) {
  return (
    <div className={styles.overlay}>
      {loading && (
        <div className={styles.spinnerWrap}>
          <div className={styles.spinner} />
          <span className={styles.spinnerText}>読み込み中…</span>
        </div>
      )}

      {error && (
        <div className={`${styles.alert} ${styles.alertError}`}>
          <span className={styles.alertIcon}>⚠️</span>
          <span className={styles.alertText}>{error}</span>
        </div>
      )}

      {info && (
        <div className={`${styles.alert} ${styles.alertSuccess}`}>
          <span className={styles.alertIcon}>✅</span>
          <span className={styles.alertText}>{info}</span>
        </div>
      )}

      {!hasData && !loading && !error && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📋</div>
          <div className={styles.emptyText}>データがありません</div>
        </div>
      )}
    </div>
  );
}
