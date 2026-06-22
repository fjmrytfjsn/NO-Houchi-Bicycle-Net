import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { DeclarationPanel } from '../../components/owner/DeclarationPanel';
import { SMSAuthPanel } from '../../components/owner/SMSAuthPanel';
import { CouponRoulette } from '../../components/owner/CouponRoulette';
import { CouponTimer } from '../../components/owner/CouponTimer';
import { ErrorStatePanel } from '../../components/owner/ErrorStatePanel';
import { QrScannerPanel } from '../../components/owner/QrScannerPanel';
import { ReportSummary } from '../../components/owner/ReportSummary';
import { StatusMessages } from '../../components/owner/StatusMessages';
import { TempUnlockButton } from '../../components/owner/TempUnlockButton';
import { useNow } from '../../hooks/useNow';
import { useQrScanner } from '../../hooks/useQrScanner';
import { getMarker, resetMarker, unlockFinal, unlockTemp, fastForwardTime } from '../../lib/api';
import { getUnlockTiming } from '../../lib/owner/time';
import type { MarkerEntry } from '../../lib/owner/types';
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
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  type CouponStep = 'none' | 'auth' | 'roulette' | 'timer' | 'skipped';
  const [couponStep, setCouponStep] = useState<CouponStep>('none');
  const [couponAmount, setCouponAmount] = useState<number>(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!code) return;

    setLoading(true);
    setError(null);
    getMarker(code)
      .then(async (markerResult) => {
        setData(markerResult);
        
        // 状態復元: localStorage から前回のクーポン状態を取得
        const savedState = localStorage.getItem(`coupon_state_${code}`);
        if (savedState) {
          try {
            const parsed = JSON.parse(savedState);
            if (parsed.step) setCouponStep(parsed.step);
            if (parsed.amount) setCouponAmount(parsed.amount);
            return; // localStorageに状態があればそちらを優先
          } catch (e) {
            // ignore JSON parse errors
          }
        }

        // モック: 既に本解除済みの場合は auth ステップから再開
        if (isFinalUnlocked(markerResult) && couponStep === 'none') {
          setCouponStep('auth');
        }
      })
      .catch(() => setError('取得に失敗しました'))
      .finally(() => setLoading(false));
  }, [code, couponStep]);

  // クーポンの状態（ステップ、金額）が変わるたびに localStorage に保存
  useEffect(() => {
    if (!code || couponStep === 'none') return;
    localStorage.setItem(`coupon_state_${code}`, JSON.stringify({
      step: couponStep,
      amount: couponAmount
    }));
  }, [code, couponStep, couponAmount]);

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
      const marker = await getMarker(code);
      setData(marker);
      setCouponStep('auth');
      showInfo('本解除が完了しました。続けてクーポンをお受け取りください。', 5000);
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

  const handleAuthComplete = useCallback(() => {
    // 認証完了直後に金額を決定し、localStorageに保存されるようにする
    const rand = Math.random() * 100;
    let decidedAmount = 10;
    if (rand < 5) decidedAmount = 100; // 1等: 5%
    else if (rand < 15) decidedAmount = 70; // 2等: 10%
    else if (rand < 35) decidedAmount = 50; // 3等: 20%
    else if (rand < 65) decidedAmount = 30; // 4等: 30%
    else decidedAmount = 10; // 5等: 35%
    
    setCouponAmount(decidedAmount);
    setCouponStep('roulette');
  }, []);

  const handleAuthSkip = useCallback(() => {
    setCouponStep('skipped');
    showInfo('クーポンの受け取りをスキップしました', 3000);
  }, [showInfo]);

  const handleRouletteComplete = useCallback(() => {
    setCouponStep('timer');
  }, []);

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
            {!finalUnlocked && (
              <ReportSummary report={data.report} declaration={data.declaration} />
            )}

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

            {finalUnlocked && couponStep === 'auth' && (
              <SMSAuthPanel onAuthComplete={handleAuthComplete} onSkip={handleAuthSkip} />
            )}
            {finalUnlocked && couponStep === 'skipped' && (
              <div style={{
                marginTop: 'var(--space-4)',
                padding: 'var(--space-6)',
                background: 'var(--color-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: 'var(--space-2)' }}>✅</div>
                <h3 style={{ margin: '0 0 var(--space-4) 0', fontSize: 'var(--text-lg)' }}>本解除が完了しました</h3>
                <p style={{ margin: '0 0 var(--space-6) 0', color: 'var(--color-text-muted)' }}>
                  ご協力ありがとうございます。<br />
                  速やかに自転車を移動させてください。
                </p>
                <a
                  href="/"
                  style={{
                    display: 'inline-block',
                    padding: 'var(--space-3) var(--space-6)',
                    background: 'var(--color-primary)',
                    color: 'var(--color-text-inverse)',
                    textDecoration: 'none',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--text-base)',
                    fontWeight: 'bold'
                  }}
                >
                  トップページへ戻る
                </a>
              </div>
            )}
            {finalUnlocked && couponStep === 'roulette' && (
              <CouponRoulette amount={couponAmount} markerCode={code as string} onComplete={handleRouletteComplete} />
            )}
            {finalUnlocked && couponStep === 'timer' && (
              <CouponTimer amount={couponAmount} markerCode={code as string} />
            )}

            {/* デモ用: 本解除完了後にリセットボタンを表示 */}
            {finalUnlocked && (
              <div style={{ marginTop: 'var(--space-6)', display: 'flex', justifyContent: 'center' }}>
                <button
                  onClick={async () => {
                    if (!code) return;
                    setLoading(true);
                    try {
                      await resetMarker(code);
                      
                      // 別のテストセッションとしてやり直せるように localStorage の該当マーカーの状態のみクリア
                      localStorage.removeItem(`coupon_state_${code}`);
                      localStorage.removeItem(`coupon_timer_${code}`);
                      localStorage.removeItem(`coupon_roulette_${code}`);
                      
                      showInfo('ステータスをリセットしました（デモ用）', 3000);
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
