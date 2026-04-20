import type { RefObject } from 'react';
import type { Declaration } from '../../lib/owner/types';
import { formatDuration } from '../../lib/owner/time';
import { QrScannerPanel } from './QrScannerPanel';

interface DeclarationPanelProps {
  declaration: Declaration;
  eligible: boolean;
  timeToEligible: number;
  timeToExpires: number;
  showQRScanner: boolean;
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  onStartScanner: () => void;
  onCancelScanner: () => void;
}

export function DeclarationPanel({
  declaration,
  eligible,
  timeToEligible,
  timeToExpires,
  showQRScanner,
  videoRef,
  canvasRef,
  onStartScanner,
  onCancelScanner,
}: DeclarationPanelProps) {
  return (
    <div
      style={{
        marginTop: 12,
        padding: 8,
        background: '#f7f7f7',
        borderRadius: 6,
      }}
    >
      <div>仮解除: {new Date(declaration.declaredAt).toLocaleString()}</div>
      <div>
        本解除可能: {new Date(declaration.eligibleFinalAt).toLocaleString()}
      </div>
      <div>自動解除: {new Date(declaration.expiresAt).toLocaleString()}</div>
      <div
        style={{
          marginTop: 12,
          padding: 12,
          background: '#fff3cd',
          borderRadius: 6,
          border: '1px solid #ffc107',
        }}
      >
        <strong>💰 本解除でクーポンをゲット！</strong>
        <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>
          QRコードを再度読み込んで本解除をしてください。
          <br />
          商店街で使えるお得なクーポンがもらえます。
        </p>
      </div>
      <div style={{ marginTop: 8 }}>
        <div style={{ marginBottom: 8 }}>
          本解除可能まで: <strong>{formatDuration(timeToEligible)}</strong>
        </div>
        <div style={{ marginBottom: 8 }}>
          自動解除まで: <strong>{formatDuration(timeToExpires)}</strong>
        </div>
        {!showQRScanner ? (
          <button
            onClick={onStartScanner}
            disabled={!eligible}
            aria-disabled={!eligible}
            style={{
              padding: '10px 16px',
              background: eligible ? '#28a745' : '#ccc',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: eligible ? 'pointer' : 'not-allowed',
              fontWeight: 'bold',
            }}
          >
            📱 QRコードを読み込んで本解除
          </button>
        ) : (
          <QrScannerPanel
            videoRef={videoRef}
            canvasRef={canvasRef}
            onCancel={onCancelScanner}
          />
        )}
      </div>
    </div>
  );
}
