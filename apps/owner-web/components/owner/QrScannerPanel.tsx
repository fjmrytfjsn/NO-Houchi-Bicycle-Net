import type { RefObject } from 'react';
import styles from './QrScannerPanel.module.css';

interface QrScannerPanelProps {
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  errorMessage?: string | null;
  isSuccess?: boolean;
  onCancel: () => void;
}

export function QrScannerPanel({
  videoRef,
  canvasRef,
  errorMessage,
  isSuccess,
  onCancel,
}: QrScannerPanelProps) {
  return (
    <div className={styles.overlay}>
      {/* Header */}
      <div className={styles.header}>
        {!isSuccess && <span className={styles.pulsingDot} />}
        {isSuccess ? '読み取り完了' : 'QRコードを読み込み中...'}
      </div>

      {/* Camera */}
      <div className={styles.videoWrap}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={styles.video}
          style={{ filter: isSuccess ? 'brightness(0.5) blur(2px)' : 'none' }}
        />
        {isSuccess ? (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(22, 101, 52, 0.85)', color: 'white', zIndex: 10 }}>
            <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>✅</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>読み取り成功</div>
            <div style={{ marginTop: '1rem', fontSize: '0.9rem', opacity: 0.9 }}>10秒後に画面が切り替わります...</div>
          </div>
        ) : (
          <>
            {/* Scan frame corners */}
            <div className={styles.scanFrame} />
            <div className={styles.scanFrameBottom} />
          </>
        )}
      </div>
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Error Message */}
      {errorMessage && (
        <div className={styles.errorBanner}>
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Guide */}
      {!errorMessage && !isSuccess && (
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
