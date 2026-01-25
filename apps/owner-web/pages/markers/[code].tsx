import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { getMarker, unlockTemp, unlockFinal, getCoupons } from '../../lib/api';
import jsQR from 'jsqr';

function formatDuration(ms: number) {
  if (ms <= 0) return '0秒';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const sec = s % 60;
  const min = m % 60;

  if (h > 0) {
    if (min > 0) return `${h}時間 ${min}分 ${sec}秒`;
    return `${h}時間 ${sec}秒`;
  }
  if (m > 0) return `${m}分 ${sec}秒`;
  return `${sec}秒`;
}

export default function MarkerPage() {
  const router = useRouter();
  const { code } = router.query as { code?: string };
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [nowTime, setNowTime] = useState(Date.now());
  const [tempUnlockDisabled, setTempUnlockDisabled] = useState(false);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const t = setInterval(() => setNowTime(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!code) return;
    setLoading(true);
    setError(null);
    getMarker(code)
      .then((r) => setData(r))
      .catch(() => setError('取得に失敗しました'))
      .finally(() => setLoading(false));
  }, [code]);

  // QRスキャナーの起動と停止
  useEffect(() => {
    if (!showQRScanner) return;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          scanQR();
        }
      } catch (err) {
        setError('カメラにアクセスできません');
        setShowQRScanner(false);
      }
    };

    startCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [showQRScanner]);

  const scanQR = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scanLoop = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && showQRScanner) {
          handleQRDetected(code.data);
          return;
        }
      }
      requestAnimationFrame(scanLoop);
    };

    scanLoop();
  };

  const handleQRDetected = async (qrData: string) => {
    setShowQRScanner(false);

    if (qrData !== code) {
      setError('異なるQRコードです。同じマーカーのQRを読み込んでください。');
      setTimeout(() => setError(null), 5000);
      return;
    }

    // QRが一致した場合は本解除を実行
    await handleFinal();
  };

  const handleTemp = async () => {
    if (!code) return;
    setLoading(true);
    setError(null);
    try {
      const res = await unlockTemp(code);
      setData((prev: any) => ({
        ...prev,
        declaration: res,
        report: { ...(prev?.report || {}), status: 'temporary' },
      }));
      setInfo('仮解除しました');
      setTimeout(() => setInfo(null), 4000);
      setTempUnlockDisabled(true);
    } catch (e) {
      setError('仮解除に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleFinal = async () => {
    if (!code || !data?.declaration) return;
    setLoading(true);
    setError(null);
    try {
      await unlockFinal(code);
      const r = await getMarker(code);
      setData(r);
      // クーポン情報を取得
      const couponData = await getCoupons(code);
      setCoupons(couponData.coupons || []);
      setInfo('本解除が完了しました。クーポンをゲットしました！');
      setTimeout(() => setInfo(null), 5000);
    } catch (e: any) {
      setError(e?.message || '本解除に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const declaration = data?.declaration;
  const eligible =
    declaration && nowTime >= new Date(declaration.eligibleFinalAt).getTime();
  const timeToEligible = declaration
    ? new Date(declaration.eligibleFinalAt).getTime() - nowTime
    : 0;
  const timeToExpires = declaration
    ? new Date(declaration.expiresAt).getTime() - nowTime
    : 0;

  return (
    <main style={{ padding: 16 }}>
      {loading && <p>読み込み中…</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {info && <p style={{ color: 'green' }}>{info}</p>}
      {!data && !loading && !error && <p>データがありません</p>}

      {data && (
        <section>
          <div style={{ border: '1px solid #ddd', padding: 8, marginTop: 8 }}>
            <div>
              <strong>ステータス:</strong> {data.report?.status || '未報告'}
            </div>
            <div>
              <strong>報告画像:</strong>
              <div>
                {data.report?.imageUrl ? (
                  <img
                    src={data.report.imageUrl}
                    alt="report"
                    style={{
                      width: '100%',
                      maxHeight: 240,
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <div
                    style={{ width: '100%', height: 160, background: '#eee' }}
                  />
                )}
              </div>
              <p>{data.report?.ocr_text}</p>
            </div>
            <div style={{ marginTop: 12 }}>
              <button
                onClick={handleTemp}
                disabled={tempUnlockDisabled}
                style={{
                  background: '#ff6b6b',
                  color: '#fff',
                  padding: '12px 16px',
                  border: 'none',
                  borderRadius: 6,
                  opacity: tempUnlockDisabled ? 0.5 : 1,
                  cursor: tempUnlockDisabled ? 'not-allowed' : 'pointer',
                }}
              >
                解除（仮）
              </button>
            </div>

            {declaration && (
              <div
                style={{
                  marginTop: 12,
                  padding: 8,
                  background: '#f7f7f7',
                  borderRadius: 6,
                }}
              >
                <div>
                  仮解除: {new Date(declaration.declaredAt).toLocaleString()}
                </div>
                <div>
                  本解除可能:{' '}
                  {new Date(declaration.eligibleFinalAt).toLocaleString()}
                </div>
                <div>
                  自動解除: {new Date(declaration.expiresAt).toLocaleString()}
                </div>
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
                    本解除可能まで:{' '}
                    <strong>{formatDuration(timeToEligible)}</strong>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    自動解除まで:{' '}
                    <strong>{formatDuration(timeToExpires)}</strong>
                  </div>
                  {!showQRScanner ? (
                    <button
                      onClick={() => setShowQRScanner(true)}
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
                        onClick={() => setShowQRScanner(false)}
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
                  )}
                </div>
              </div>
            )}

            {coupons.length > 0 && (
              <div
                style={{
                  marginTop: 12,
                  padding: 12,
                  background: '#d4edda',
                  borderRadius: 6,
                  border: '1px solid #28a745',
                }}
              >
                <h3 style={{ margin: '0 0 8px 0' }}>🎁 獲得したクーポン</h3>
                {coupons.map((coupon, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: 8,
                      background: '#fff',
                      borderRadius: 4,
                      marginBottom: 8,
                      borderLeft: '4px solid #28a745',
                    }}
                  >
                    <div style={{ fontWeight: 'bold' }}>{coupon.name}</div>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      {coupon.discount}
                      {coupon.discountType === 'fixed' ? '' : '割引'}
                    </div>
                    {coupon.expiresAt && (
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        有効期限:{' '}
                        {new Date(coupon.expiresAt).toLocaleDateString('ja-JP')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
