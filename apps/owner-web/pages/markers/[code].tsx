import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { CouponList } from '../../components/owner/CouponList';
import { DeclarationPanel } from '../../components/owner/DeclarationPanel';
import { QrScannerPanel } from '../../components/owner/QrScannerPanel';
import { ReportSummary } from '../../components/owner/ReportSummary';
import { StatusMessages } from '../../components/owner/StatusMessages';
import { TempUnlockButton } from '../../components/owner/TempUnlockButton';
import { useNow } from '../../hooks/useNow';
import { useQrScanner } from '../../hooks/useQrScanner';
import { getCoupons, getMarker, unlockFinal, unlockTemp } from '../../lib/api';
import { getUnlockTiming } from '../../lib/owner/time';
import type { Coupon, MarkerEntry } from '../../lib/owner/types';
import styles from './MarkerPage.module.css';

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
    Promise.all([getMarker(code), getCoupons(code)])
      .then(([markerResult, couponResult]) => {
        setData(markerResult);
        setCoupons(couponResult.coupons || []);
      })
      .catch(() => setError('取得に失敗しました'))
      .finally(() => setLoading(false));
  }, [code]);

  const showInfo = useCallback((message: string, timeoutMs: number) => {
    setInfo(message);
    setTimeout(() => setInfo(null), timeoutMs);
  }, []);

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
          imageUrl: previous?.report?.imageUrl || '',
          ocr_text: previous?.report?.ocr_text || '',
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
    setError('カメラにアクセスできません');
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
          <h1 className={styles.pageTitle} style={{ margin: 0, fontSize: 'var(--text-base)' }}>
            <span>📍</span>
            マーカー
          </h1>
          {code && <span className={styles.markerCode} style={{ margin: 0, padding: '2px 8px' }}>{code}</span>}
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

            {declaration && timing && (
              <DeclarationPanel
                declaration={declaration}
                eligible={timing.eligible}
                timeToEligible={timing.timeToEligible}
                timeToExpires={timing.timeToExpires}
                onStartScanner={() => setShowQRScanner(true)}
              />
            )}

            {/* 期限切れの場合、再度仮解除ボタンを表示 */}
            {declaration && timing && timing.timeToExpires <= 0 &&
              declaration.status !== 'finalized' && declaration.status !== 'resolved' && (
              <TempUnlockButton
                onClick={handleTemp}
                disabled={tempUnlockDisabled}
              />
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
      </div>
    </>
  );
}
