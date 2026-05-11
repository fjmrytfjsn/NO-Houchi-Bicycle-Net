import type { RefObject } from 'react';
import styles from './QrScannerPanel.module.css';

interface QrScannerPanelProps {
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  errorMessage?: string | null;
  onCancel: () => void;
}

export function QrScannerPanel({
  videoRef,
  canvasRef,
  errorMessage,
  onCancel,
}: QrScannerPanelProps) {
  return (
    <div className={styles.overlay}>
      {/* Header */}
      <div className={styles.header}>
        <span className={styles.pulsingDot} />
        QRコードを読み込み中...
      </div>

      {/* Camera */}
      <div className={styles.videoWrap}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={styles.video}
        />
        {/* Scan frame corners */}
        <div className={styles.scanFrame} />
        <div className={styles.scanFrameBottom} />
      </div>
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Error Message */}
      {errorMessage && (
        <div className={styles.errorBanner}>
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Guide */}
      {!errorMessage && (
        <p className={styles.guideText}>
          マーカーのQRコードを枠内に合わせてください
        </p>
      )}

      {/* Cancel */}
      <button onClick={onCancel} className={styles.cancelButton}>
        ✕ キャンセル
      </button>
    </div>
  );
}
