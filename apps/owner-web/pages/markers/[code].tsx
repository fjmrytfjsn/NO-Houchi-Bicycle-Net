import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getMarker, unlockTemp, unlockFinal } from '../../lib/api';

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
      setInfo('本解除が完了しました');
      setTimeout(() => setInfo(null), 4000);
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
      <button onClick={() => router.back()}>← 戻る</button>
      {loading && <p>読み込み中…</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {info && <p style={{ color: 'green' }}>{info}</p>}
      {!data && !loading && !error && <p>データがありません</p>}

      {data && (
        <section>
          <h2>マーカー: {data.marker.code}</h2>
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
                <div style={{ marginTop: 8 }}>
                  <div style={{ marginBottom: 8 }}>
                    本解除まで:{' '}
                    <strong>{formatDuration(timeToEligible)}</strong>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    自動解除まで:{' '}
                    <strong>{formatDuration(timeToExpires)}</strong>
                  </div>
                  <button
                    onClick={handleFinal}
                    disabled={!eligible}
                    aria-disabled={!eligible}
                    style={{ padding: '8px 12px' }}
                  >
                    本解除を実行
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
