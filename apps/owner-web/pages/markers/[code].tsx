import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { CouponList } from '../../components/owner/CouponList';
import { DeclarationPanel } from '../../components/owner/DeclarationPanel';
import { ErrorStatePanel } from '../../components/owner/ErrorStatePanel';
import { QrScannerPanel } from '../../components/owner/QrScannerPanel';
import { ReportSummary } from '../../components/owner/ReportSummary';
import { StatusMessages } from '../../components/owner/StatusMessages';
import { TempUnlockButton } from '../../components/owner/TempUnlockButton';
import { useNow } from '../../hooks/useNow';
import { useQrScanner } from '../../hooks/useQrScanner';
import { getCoupons, getMarker, resetMarker, unlockFinal, unlockTemp, fastForwardTime } from '../../lib/api';
import { getUnlockTiming } from '../../lib/owner/time';
import type { Coupon, MarkerEntry } from '../../lib/owner/types';
import styles from './MarkerPage.module.css';

function isFinalUnlocked(entry: MarkerEntry) {
  return (
    entry.report.status === 'resolved' ||
    entry.declaration?.status === 'finalized'
  );
}

export default function MarkerPage() {
  const router = useRouter();
  const { code } = router.query as { code?: string };
  const nowTime = useNow();
  const [data, setData] = useState<MarkerEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [tempUnlockDisabled, setTempUnlockDisabled] = useState(false);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!code) return;

    setLoading(true);
    setError(null);
    getMarker(code)
      .then(async (markerResult) => {
        setData(markerResult);
        try {
          const couponResult = await getCoupons(code);
          setCoupons(couponResult.coupons || []);
        } catch {
          setCoupons([]);
        }
      })
      .catch(() => setError('取得に失敗しました'))
      .finally(() => setLoading(false));
  }, [code]);

  const showInfo = useCallback((message: string, timeoutMs: number) => {
    setInfo(message);
    setTimeout(() => setInfo(null), timeoutMs);
  }, []);

  const handleFastForward = useCallback(async () => {
    if (!code) return;
    setLoading(true);
    try {
      await fastForwardTime(code);
      const marker = await getMarker(code);
      setData(marker);
      showInfo('待機時間をスキップしました', 3000);
    } catch (err: any) {
      setError(err.message || 'スキップに失敗しました');
    } finally {
      setLoading(false);
    }
  }, [code, showInfo]);

  const handleTemp = async () => {
    if (!code) return;

    setLoading(true);
    setError(null);
    try {
      const declaration = await unlockTemp(code);
      setData((previous) => ({
        marker: previous?.marker || { code },
        report: {
          id: previous?.report?.id || `r-${code}`,
          markerId: previous?.report?.markerId || `m-${code}`,
          imageUrl: previous?.report?.imageUrl || '',
          latitude: previous?.report?.latitude || 0,
          longitude: previous?.report?.longitude || 0,
          address: previous?.report?.address ?? null,
          identifierText: previous?.report?.identifierText || '',
          notes: previous?.report?.notes ?? null,
          createdAt: previous?.report?.createdAt,
          updatedAt: previous?.report?.updatedAt,
          status: 'temporary',
        },
        declaration,
      }));
      showInfo('仮解除しました', 4000);
      setTempUnlockDisabled(true);
    } catch {
      setError('仮解除に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleFinal = useCallback(async () => {
    if (!code || !data?.declaration) return;

    setLoading(true);
    setError(null);
    try {
      await unlockFinal(code);
      const [marker, couponData] = await Promise.all([
        getMarker(code),
        getCoupons(code),
      ]);
      setData(marker);
      setCoupons(couponData.coupons || []);
      showInfo('本解除が完了しました。クーポンをゲットしました！', 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '本解除に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [code, data?.declaration, showInfo]);

  const handleQRDetected = useCallback(
    async (qrData: string) => {
      if (qrData !== code) {
        setScanError('異なるQRコードです。同じマーカーのQRを読み込んでください。');
        setTimeout(() => setScanError(null), 5000);
        return;
      }

      setShowQRScanner(false);
      await handleFinal();
    },
    [code, handleFinal]
  );

  const handleCameraError = useCallback(() => {
    setError('カメラにアクセスできません。ブラウザの設定からカメラのアクセスを許可し、ページを再読み込みしてください。');
    setShowQRScanner(false);
  }, []);

  useQrScanner({
    active: showQRScanner,
    videoRef,
    canvasRef,
    onDetected: handleQRDetected,
    onCameraError: handleCameraError,
  });

  const declaration = data?.declaration;
  const finalUnlocked = data ? isFinalUnlocked(data) : false;
  const timing = declaration
    ? getUnlockTiming(
      nowTime,
      declaration.eligibleFinalAt,
      declaration.expiresAt
    )
    : null;

  return (
    <>
      <Head>
        <title>
          {code ? `マーカー ${code}` : 'マーカー'} - NO-Houchi Bicycle Net
        </title>
      </Head>

      <div className={styles.page}>
        {error && !data ? (
          <ErrorStatePanel message={error} />
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
          {/*ここから*/}
          <h1 className={styles.pageTitle} style={{ margin: 0, fontSize: 'var(--text-base)' }}>
            <span onDoubleClick={handleFinal} style={{ cursor: 'pointer' }} title="デモ用: ダブルクリックで強制本解除">📍</span>
            マーカー
          </h1>
          {code && (
            <span 
              className={styles.markerCode} 
              style={{ margin: 0, padding: '2px 8px', cursor: 'pointer' }}
              onDoubleClick={() => {
                setError('デモ用: データが見つかりませんでした');
                setData(null);
              }}
              title="デモ用: ダブルクリックでエラー画面を強制表示"
            >
              {code}
            </span>
          )}
          {/*ここまで消す*/}
        </div>

        <StatusMessages
          loading={loading}
          error={error}
          info={info}
          hasData={Boolean(data)}
        />

        {data && (
          <>
            <ReportSummary report={data.report} declaration={data.declaration} />

            {!declaration && (
              <TempUnlockButton
                onClick={handleTemp}
                disabled={tempUnlockDisabled}
              />
            )}

            {declaration && timing && !finalUnlocked && (
              <DeclarationPanel
                declaration={declaration}
                eligible={timing.eligible}
                timeToEligible={timing.timeToEligible}
                timeToExpires={timing.timeToExpires}
                onStartScanner={() => setShowQRScanner(true)}
                onReset={handleTemp}
                onFastForward={handleFastForward}
              />
            )}

            {/* デモ用: 本解除完了後にリセットボタンを表示 */}
            {finalUnlocked && (
              <div style={{ marginTop: 'var(--space-4)', display: 'flex', justifyContent: 'center' }}>
                <button
                  onClick={async () => {
                    if (!code) return;
                    setLoading(true);
                    try {
                      await resetMarker(code);
                      router.push('/');
                    } catch {
                      setError('リセットに失敗しました');
                      setLoading(false);
                    }
                  }}
                  style={{
                    padding: 'var(--space-3) var(--space-6)',
                    background: 'var(--color-text-muted)',
                    color: 'var(--color-text-inverse)',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--text-base)',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  🔄 もう一度試す
                </button>
              </div>
            )}

            <CouponList coupons={coupons} />

            {/* QRスキャナー モーダル */}
            {showQRScanner && (
              <QrScannerPanel
                videoRef={videoRef}
                canvasRef={canvasRef}
                errorMessage={scanError}
                onCancel={() => { setShowQRScanner(false); setScanError(null); }}
              />
            )}
          </>
        )}
      </>
    )}

        {/* Footer / Help Link */}
        <div style={{ textAlign: 'center', marginTop: 'var(--space-8)', padding: 'var(--space-4) 0', borderTop: '1px solid var(--color-surface)' }}>
          <Link
            href="/help"
            style={{
              color: 'var(--color-primary)',
              textDecoration: 'underline',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
            }}
          >
            ヘルプ・お問い合わせはこちら
          </Link>
        </div>
      </div>
    </>
  );
}
