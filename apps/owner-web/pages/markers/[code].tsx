import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { CouponList } from '../../components/owner/CouponList';
import { DeclarationPanel } from '../../components/owner/DeclarationPanel';
import { ReportSummary } from '../../components/owner/ReportSummary';
import { StatusMessages } from '../../components/owner/StatusMessages';
import { TempUnlockButton } from '../../components/owner/TempUnlockButton';
import { useNow } from '../../hooks/useNow';
import { useQrScanner } from '../../hooks/useQrScanner';
import { getCoupons, getMarker, unlockFinal, unlockTemp } from '../../lib/api';
import { getUnlockTiming } from '../../lib/owner/time';
import type { Coupon, MarkerEntry } from '../../lib/owner/types';

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!code) return;

    setLoading(true);
    setError(null);
    getMarker(code)
      .then((result) => setData(result))
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
      setShowQRScanner(false);

      if (qrData !== code) {
        setError('異なるQRコードです。同じマーカーのQRを読み込んでください。');
        setTimeout(() => setError(null), 5000);
        return;
      }

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
    <main style={{ padding: 16 }}>
      <StatusMessages
        loading={loading}
        error={error}
        info={info}
        hasData={Boolean(data)}
      />

      {data && (
        <section>
          <div style={{ border: '1px solid #ddd', padding: 8, marginTop: 8 }}>
            <ReportSummary report={data.report} />
            <TempUnlockButton
              onClick={handleTemp}
              disabled={tempUnlockDisabled}
            />

            {declaration && timing && (
              <DeclarationPanel
                declaration={declaration}
                eligible={timing.eligible}
                timeToEligible={timing.timeToEligible}
                timeToExpires={timing.timeToExpires}
                showQRScanner={showQRScanner}
                videoRef={videoRef}
                canvasRef={canvasRef}
                onStartScanner={() => setShowQRScanner(true)}
                onCancelScanner={() => setShowQRScanner(false)}
              />
            )}

            <CouponList coupons={coupons} />
          </div>
        </section>
      )}
    </main>
  );
}
