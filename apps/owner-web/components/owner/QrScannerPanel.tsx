import type { RefObject } from 'react';

interface QrScannerPanelProps {
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  onCancel: () => void;
}

export function QrScannerPanel({
  videoRef,
  canvasRef,
  onCancel,
}: QrScannerPanelProps) {
  return (
    <div
      style={{
        marginTop: 12,
        padding: 12,
        background: '#e8f5e9',
        borderRadius: 6,
        border: '2px solid #28a745',
      }}
    >
      <div style={{ marginBottom: 8, fontWeight: 'bold' }}>
        📷 QRコードを読み込み中...
      </div>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{
          width: '100%',
          maxWidth: '100%',
          borderRadius: 6,
          marginBottom: 8,
        }}
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <button
        onClick={onCancel}
        style={{
          padding: '8px 12px',
          background: '#999',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
          width: '100%',
        }}
      >
        キャンセル
      </button>
    </div>
  );
}
