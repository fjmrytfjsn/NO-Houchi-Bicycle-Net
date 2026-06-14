import { useEffect, useState } from 'react';

interface CouponTimerProps {
  amount: number;
}

export function CouponTimer({ amount }: CouponTimerProps) {
  const [showCode, setShowCode] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15分 = 900秒
  // ランダムな6文字の英数字コードを生成（初回描画時のみ実行）
  const [couponCode] = useState(() =>
    Math.random().toString(36).substring(2, 8).toUpperCase()
  );

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (showCode && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showCode, timeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isExpired = timeLeft <= 0;

  if (!showCode) {
    return (
      <div style={{
        padding: 'var(--space-6)',
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        marginTop: 'var(--space-4)',
      }}>
        <h3 style={{ margin: '0 0 var(--space-4) 0', fontSize: '1.5rem', textAlign: 'center' }}>
          クーポンのご利用確認
        </h3>
        <div style={{
          background: 'var(--color-background)',
          padding: 'var(--space-5)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--space-5)',
          fontSize: 'var(--text-base)',
          lineHeight: 1.8,
          color: 'var(--color-text-muted)'
        }}>
          <p style={{ margin: '0 0 var(--space-3) 0', fontWeight: 'bold', color: 'var(--color-text)', fontSize: '1.1rem' }}>
            今後自転車を放置しないでください。<br />提携店舗のみでご利用可能となります。<br />利用の店舗ですか？すぐご利用されますか？
          </p>
          <p style={{ margin: '0 0 var(--space-3) 0' }}>
            一度はいと押して時間が過ぎた場合無効となります。
          </p>
          <p style={{ margin: '0 0 var(--space-3) 0' }}>
            クーポンコード表示後、<span style={{ color: 'var(--color-primary)', fontWeight: 'bold', fontSize: '1.1rem' }}>15分以内</span>にレジにて提示してください。
          </p>
          <p style={{ margin: 0, color: 'var(--color-error)', fontWeight: 'bold' }}>
            15分経過するとクーポンは無効になるのでご注意ください。<br />15分経過による補償はできません。
          </p>
        </div>

        <button
          onClick={() => setShowCode(true)}
          style={{
            width: '100%',
            padding: 'var(--space-4)',
            background: 'var(--color-primary)',
            color: 'var(--color-text-inverse)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-lg)',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          はい（コードを表示する）
        </button>
      </div>
    );
  }

  return (
    <div style={{
      padding: 'var(--space-4)',
      background: isExpired ? 'var(--color-background)' : 'var(--color-surface)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--color-border)',
      marginTop: 'var(--space-4)',
      textAlign: 'center',
      opacity: isExpired ? 0.7 : 1
    }}>
      <h3 style={{ margin: '0 0 var(--space-2) 0', fontSize: 'var(--text-lg)' }}>
        クーポン ({amount}円分)
      </h3>

      {isExpired ? (
        <div style={{ margin: 'var(--space-4) 0', color: 'var(--color-error)', fontWeight: 'bold', fontSize: 'var(--text-lg)' }}>
          15分経過によりクーポンは無効になりました
        </div>
      ) : (
        <>
          <div style={{
            background: 'var(--color-background)',
            padding: 'var(--space-4)',
            margin: 'var(--space-4) 0',
            borderRadius: 'var(--radius-md)',
            fontFamily: 'monospace',
            fontSize: '2rem',
            letterSpacing: '0.2em',
            fontWeight: 'bold',
            color: 'var(--color-text)'
          }}>
            {couponCode}
          </div>
          <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', color: 'var(--color-primary)' }}>
            残り {minutes}:{seconds.toString().padStart(2, '0')}
          </div>
          <p style={{ margin: 'var(--space-2) 0 0 0', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
            15分以内にレジで提示してください
          </p>
        </>
      )}
    </div>
  );
}
