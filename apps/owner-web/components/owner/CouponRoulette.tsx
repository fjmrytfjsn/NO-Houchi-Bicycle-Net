import { useEffect, useState } from 'react';

interface CouponRouletteProps {
  onComplete: (amount: number) => void;
}

const AMOUNTS = [50, 30, 10];

export function CouponRoulette({ onComplete }: CouponRouletteProps) {
  const [currentAmount, setCurrentAmount] = useState(50);
  const [isSpinning, setIsSpinning] = useState(true);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    let timeout: ReturnType<typeof setTimeout>;

    if (isSpinning) {
      // スピン演出：0.1秒ごとに金額を切り替える
      interval = setInterval(() => {
        setCurrentAmount(AMOUNTS[Math.floor(Math.random() * AMOUNTS.length)]);
      }, 100);

      // 3秒後にスピン停止
      timeout = setTimeout(() => {
        setIsSpinning(false);
        clearInterval(interval);
        
        // 最終的な金額を決定 (モックとして今回はランダム)
        const finalAmount = AMOUNTS[Math.floor(Math.random() * AMOUNTS.length)];
        setCurrentAmount(finalAmount);
        
        // 少し待ってから次へ進む
        setTimeout(() => {
          onComplete(finalAmount);
        }, 1500);
      }, 3000);
    }

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isSpinning, onComplete]);

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
        margin: 'var(--space-4) 0'
      }}>
        {currentAmount} <span style={{ fontSize: '1.5rem' }}>円</span>
      </div>

      <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', minHeight: '20px' }}>
        {isSpinning ? 'ルーレット回転中...' : '金額決定！'}
      </div>
    </div>
  );
}
