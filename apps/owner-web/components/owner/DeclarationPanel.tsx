import type { Declaration } from '../../lib/owner/types';
import { formatDuration } from '../../lib/owner/time';
import styles from './DeclarationPanel.module.css';

interface DeclarationPanelProps {
  declaration: Declaration;
  eligible: boolean;
  timeToEligible: number;
  timeToExpires: number;
  onStartScanner: () => void;
  onReset: () => void;
}

export function DeclarationPanel({
  declaration,
  eligible,
  timeToEligible,
  timeToExpires,
  onStartScanner,
  onReset,
}: DeclarationPanelProps) {
  const isResolved = declaration.status === 'finalized' || declaration.status === 'resolved';
  const isExpired = declaration.status === 'expired' || timeToExpires <= 0;

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>
          <span>📋</span>
          解除ステータス
        </h2>
      </div>

      <div className={styles.panelBody}>
        {/* Compact Timeline */}
        <div className={styles.timeline}>
          <div className={styles.timelineItem}>
            <span className={`${styles.timelineDot} ${styles.dotDeclared}`} />
            <span className={styles.timelineLabel}>仮解除:</span>
            <span className={styles.timelineValue}>
              {new Date(declaration.declaredAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className={styles.timelineItem}>
            <span className={`${styles.timelineDot} ${styles.dotEligible}`} />
            <span className={styles.timelineLabel}>本解除可能:</span>
            <span className={styles.timelineValue}>
              {new Date(declaration.eligibleFinalAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* === Resolved State === */}
        {isResolved && (
          <div className={`${styles.statusBanner} ${styles.statusBannerResolved}`}>
            <span className={styles.statusIcon}>✅</span>
            <div className={`${styles.statusTitle} ${styles.statusTitleResolved}`}>
              本解除が完了しました
            </div>
            <div className={styles.statusMessage}>
              自転車の解除手続きが完了しました。<br />
              発行されたクーポンをご利用ください。
            </div>
          </div>
        )}

        {/* === Expired State === */}
        {isExpired && !isResolved && (
          <div className={`${styles.statusBanner} ${styles.statusBannerExpired}`}>
            <span className={styles.statusIcon}>⏰</span>
            <div className={`${styles.statusTitle} ${styles.statusTitleExpired}`}>
              期限切れになりました
            </div>
            <div className={styles.statusMessage}>
              仮解除から24時間が経過したため、期限切れとなりました。<br />
              再度「仮解除」から手続きを行ってください。
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={onReset}
                className={styles.finalButton}
                style={{ width: 'auto', padding: '0.75rem 2rem' }}
              >
                もう一度仮解除する
              </button>
            </div>
          </div>
        )}

        {/* === Temporary (active) State === */}
        {!isResolved && !isExpired && (
          <>
            {/* Slim Promo Banner */}
            <div className={styles.promoCard}>
              <div className={styles.promoTitle}>
                <span>💰</span>
                本解除でクーポンをゲット！
              </div>
            </div>

            {/* Compact Countdown Row */}
            <div className={styles.countdownGrid}>
              <div className={styles.countdownItem}>
                <div className={styles.countdownLabel}>{eligible ? '準備完了' : '本解除まで'}</div>
                <div
                  className={`${styles.countdownValue} ${
                    eligible ? styles.countdownValueReady : ''
                  }`}
                  style={{ fontSize: 'var(--text-base)' }}
                >
                  {eligible ? '✓' : formatDuration(timeToEligible)}
                </div>
              </div>
              <div className={styles.countdownItem}>
                <div className={styles.countdownLabel}>期限まで</div>
                <div className={styles.countdownValue} style={{ fontSize: 'var(--text-base)' }}>
                  {formatDuration(timeToExpires)}
                </div>
              </div>
            </div>

            {/* Action */}
            <button
              onClick={onStartScanner}
              disabled={!eligible}
              aria-disabled={!eligible}
              className={styles.finalButton}
            >
              📱 QRコードを読み込んで本解除
            </button>
          </>
        )}
      </div>
    </div>
  );
}
