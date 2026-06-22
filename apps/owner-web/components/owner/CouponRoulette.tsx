import { useEffect, useState } from 'react';

interface CouponRouletteProps {
  amount: number;
  markerCode: string;
  onComplete: () => void;
}

const AMOUNTS = [100, 70, 50, 30, 10];
const AMOUNT_TO_RANK: Record<number, number> = {
  100: 1,
  70: 2,
  50: 3,
  30: 4,
  10: 5
};

export function CouponRoulette({ amount, markerCode, onComplete }: CouponRouletteProps) {
  const [currentAmount, setCurrentAmount] = useState(100);
  const [isSpinning, setIsSpinning] = useState(true);

  useEffect(() => {
    if (!markerCode) return;

    let interval: ReturnType<typeof setInterval>;
    let timeout: ReturnType<typeof setTimeout>;

    // localStorageから開始時刻を取得、なければ現在時刻を保存
    const saved = localStorage.getItem(`coupon_roulette_${markerCode}`);
    let startTime = Date.now();
    if (!saved) {
      localStorage.setItem(`coupon_roulette_${markerCode}`, JSON.stringify({ startTime }));
    } else {
      try {
        startTime = JSON.parse(saved).startTime;
      } catch (e) {}
    }

    const elapsed = Date.now() - startTime;
    const spinDuration = 3000;
    const totalDuration = 4500; // spin + wait

    if (elapsed >= spinDuration) {
      // 既にスピン時間は経過している場合
      setIsSpinning(false);
      setCurrentAmount(amount);
      const remainingWait = Math.max(0, totalDuration - elapsed);
      timeout = setTimeout(() => {
        onComplete();
      }, remainingWait);
      return () => clearTimeout(timeout);
    }

    const remainingSpin = spinDuration - elapsed;

    if (isSpinning) {
      // スピン演出：0.1秒ごとに金額を切り替える
      interval = setInterval(() => {
        setCurrentAmount(AMOUNTS[Math.floor(Math.random() * AMOUNTS.length)]);
      }, 100);

      // 残りのスピン時間後に停止
      timeout = setTimeout(() => {
        setIsSpinning(false);
        clearInterval(interval);
        
        // 親コンポーネントで事前決定された金額で止める
        setCurrentAmount(amount);
        
        // 少し待ってから次へ進む
        setTimeout(() => {
          onComplete();
        }, 1500);
      }, remainingSpin);
    }

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isSpinning, amount, markerCode, onComplete]);

  return (
    <div style={{
      padding: 'var(--space-6)',
      background: 'var(--color-surface)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--color-border)',
      marginTop: 'var(--space-4)',
      textAlign: 'center'
    }}>
      <h3 style={{ margin: '0 0 var(--space-4) 0', fontSize: 'var(--text-lg)' }}>
        ルーレットでクーポン金額決定！
      </h3>
      
      <div style={{
        fontSize: '3rem',
        fontWeight: 'bold',
        color: isSpinning ? 'var(--color-text)' : 'var(--color-primary)',
        transition: 'color 0.3s ease',
        margin: 'var(--space-4) 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '120px'
      }}>
        {isSpinning ? (
          <div>
            {AMOUNT_TO_RANK[currentAmount] || '?'} <span style={{ fontSize: '1.5rem' }}>等</span>
          </div>
        ) : (
          <>
            <div style={{ fontSize: '1.5rem', color: 'var(--color-text)', marginBottom: 'var(--space-2)' }}>
              {AMOUNT_TO_RANK[currentAmount] || '?'}等
            </div>
            <div>
              {currentAmount} <span style={{ fontSize: '1.5rem' }}>円</span>
            </div>
          </>
        )}
      </div>

      <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', minHeight: '20px' }}>
        {isSpinning ? 'ルーレット回転中...' : '金額決定！'}
      </div>
    </div>
  );
}
