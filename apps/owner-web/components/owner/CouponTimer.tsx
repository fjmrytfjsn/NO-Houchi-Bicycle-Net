import { useEffect, useState, useRef } from 'react';

interface CouponTimerProps {
  amount: number;
  markerCode: string;
}

export function CouponTimer({ amount, markerCode }: CouponTimerProps) {
  const [showCode, setShowCode] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15分 = 900秒
  const [couponCode, setCouponCode] = useState(() =>
    Math.random().toString(36).substring(2, 8).toUpperCase()
  );
  const [liveTime, setLiveTime] = useState(new Date());

  // スワイプ（もぎり）用のステート
  const [isUsed, setIsUsed] = useState(false);
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  // マウント時に localStorage から状態を復元
  useEffect(() => {
    if (!markerCode) return;
    const saved = localStorage.getItem(`coupon_timer_${markerCode}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.showCode) setShowCode(parsed.showCode);
        if (parsed.couponCode) setCouponCode(parsed.couponCode);
        if (parsed.isUsed) {
          setIsUsed(true);
          setSwipeProgress(100);
        }
        if (parsed.startTime) {
          // 開始時刻から経過時間を計算し、残り時間を設定
          const elapsed = Math.floor((Date.now() - parsed.startTime) / 1000);
          const remaining = Math.max(0, 15 * 60 - elapsed);
          setTimeLeft(remaining);
        }
      } catch (e) {
        // ignore errors
      }
    }
  }, [markerCode]);

  // 「はい（コードを表示）」ボタンを押したときの処理
  const handleShowCode = () => {
    setShowCode(true);

    // まだ localStorage に保存されていなければ保存する
    const saved = localStorage.getItem(`coupon_timer_${markerCode}`);
    if (!saved) {
      localStorage.setItem(`coupon_timer_${markerCode}`, JSON.stringify({
        showCode: true,
        couponCode: couponCode,
        startTime: Date.now(),
        isUsed: false
      }));
    }
  };

  // スワイプ操作のハンドリング
  const updateSwipe = (clientX: number) => {
    if (!isDragging || !sliderRef.current || isUsed) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const knobWidth = 60;
    const maxMove = rect.width - knobWidth;
    // タッチした位置がツマミの中心になるように計算
    const x = Math.max(0, Math.min(clientX - rect.left - (knobWidth / 2), maxMove));
    const progress = (x / maxMove) * 100;
    setSwipeProgress(progress);
  };

  const stopSwipe = () => {
    if (!isDragging || isUsed) return;
    setIsDragging(false);
    if (swipeProgress > 85) {
      setIsUsed(true);
      setSwipeProgress(100);
      const saved = localStorage.getItem(`coupon_timer_${markerCode}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.isUsed = true;
        localStorage.setItem(`coupon_timer_${markerCode}`, JSON.stringify(parsed));
      }
    } else {
      setSwipeProgress(0); // 戻る
    }
  };

  // ドラッグ中に画面外に出た場合の対策
  useEffect(() => {
    const handleMouseUp = () => stopSwipe();
    const handleTouchEnd = () => stopSwipe();
    if (isDragging) {
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchend', handleTouchEnd);
      return () => {
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, swipeProgress, isUsed, markerCode]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (showCode && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showCode, timeLeft]);

  // スクリーンショット防止用のライブ時計
  useEffect(() => {
    if (!showCode || isUsed) return;
    const interval = setInterval(() => {
      setLiveTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, [showCode, isUsed]);

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
          <div style={{ textAlign: 'center', margin: 'var(--space-4) 0' }}>
            <a
              href="/shops"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                padding: 'var(--space-2) var(--space-4)',
                background: 'white',
                color: 'var(--color-primary)',
                border: '2px solid var(--color-primary)',
                borderRadius: 'var(--radius-md)',
                textDecoration: 'none',
                fontWeight: 'bold',
                fontSize: '0.95rem'
              }}
            >
              📍 使えるお店（提携店舗）を確認する
            </a>
          </div>

          <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'var(--color-text-muted)',
                textDecoration: 'underline',
                fontSize: 'var(--text-sm)',
              }}
            >
              クーポン利用規約はこちら
            </a>
          </div>

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
          onClick={handleShowCode}
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
      marginTop: 'var(--space-4)',
      textAlign: 'center',
    }}>
      {/* チケット全体コンテナ */}
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: '12px',
        border: '1px solid var(--color-border)',
        boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
        position: 'relative',
        overflow: 'hidden',
        opacity: isExpired ? 0.7 : 1,
        transition: 'all 0.3s ease'
      }}>

        {/* --- チケット上部（本体） --- */}
        <div style={{ padding: 'var(--space-6) var(--space-4)', position: 'relative' }}>
          <h3 style={{ margin: '0 0 var(--space-2) 0', fontSize: 'var(--text-lg)' }}>
            クーポン ({amount}円分)
          </h3>

          {isExpired && !isUsed ? (
            <div style={{ margin: 'var(--space-4) 0', color: 'var(--color-error)', fontWeight: 'bold', fontSize: 'var(--text-lg)' }}>
              15分経過によりクーポンは無効になりました
            </div>
          ) : (
            <>
              <div style={{
                background: 'var(--color-background)',
                padding: 'var(--space-3)',
                margin: 'var(--space-4) 0',
                borderRadius: 'var(--radius-md)',
                fontFamily: 'monospace',
                fontSize: '3rem',
                letterSpacing: '2px',
                fontWeight: 'bold',
                color: isUsed ? 'var(--color-text-muted)' : 'var(--color-text)',
                textDecoration: isUsed ? 'line-through' : 'none',
                position: 'relative'
              }}>
                {couponCode}
                {isUsed && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%) rotate(-15deg)',
                    color: 'var(--color-error)',
                    border: '4px solid var(--color-error)',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '2rem',
                    fontWeight: '900',
                    letterSpacing: '8px',
                    opacity: 0.8,
                    pointerEvents: 'none'
                  }}>
                    利用済
                  </div>
                )}
              </div>

              {!isUsed && (
                <>
                  {/* スクリーンショット防止用ライブ時計 */}
                  <div style={{
                    marginTop: 'var(--space-2)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-text-muted)'
                  }}>
                    <span style={{
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-primary)',
                      animation: 'pulse 1s infinite alternate'
                    }}></span>
                    {liveTime.toLocaleString()}
                  </div>
                  <style>{`
                    @keyframes pulse {
                      0% { opacity: 0.3; transform: scale(0.8); }
                      100% { opacity: 1; transform: scale(1.2); }
                    }
                  `}</style>

                  <div style={{ marginTop: 'var(--space-4)', fontSize: 'var(--text-lg)', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                    残り {minutes}:{seconds.toString().padStart(2, '0')}
                  </div>
                  <p style={{ margin: 'var(--space-2) 0 0 0', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                    15分以内にレジで提示してください
                  </p>
                </>
              )}
            </>
          )}

          {/* 利用済み後のアクションエリア */}
          {isUsed && (
            <div style={{ marginTop: 'var(--space-6)' }}>
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
                  fontWeight: 'bold',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
              >
                トップページへ戻る
              </a>
              <div style={{ marginTop: 'var(--space-4)' }}>
                <button
                  onClick={() => {
                    localStorage.removeItem('used_phone_numbers');
                    alert('【デモ用】電話番号の利用履歴をクリアしました。');
                  }}
                  style={{
                    padding: 'var(--space-2) var(--space-4)',
                    background: 'transparent',
                    color: 'var(--color-text-muted)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--text-sm)',
                    cursor: 'pointer'
                  }}
                >
                  デモ用: 電話番号履歴をクリア
                </button>
              </div>
            </div>
          )}
        </div>

        {/* --- 切り取り線（ミシン目） --- */}
        {!isExpired && (
          <div style={{
            position: 'relative',
            height: '2px',
            background: 'transparent',
            backgroundImage: 'linear-gradient(to right, var(--color-border) 50%, transparent 50%)',
            backgroundSize: '16px 2px',
            margin: '0',
            opacity: isUsed ? 0 : 1,
            transition: 'opacity 0.3s ease'
          }}>
            {/* 左の半円の切り欠き */}
            <div style={{ position: 'absolute', top: '-10px', left: '-10px', width: '20px', height: '20px', background: 'var(--color-background)', borderRadius: '50%', borderRight: '1px solid var(--color-border)' }}></div>
            {/* 右の半円の切り欠き */}
            <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '20px', height: '20px', background: 'var(--color-background)', borderRadius: '50%', borderLeft: '1px solid var(--color-border)' }}></div>
          </div>
        )}

        {/* --- チケット下部（半券・もぎり部分） --- */}
        {!isExpired && (
          <div style={{
            padding: 'var(--space-6) var(--space-4)',
            background: 'rgba(0,0,0,0.02)',
            transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isUsed ? 'translateY(100%) rotate(5deg)' : 'translateY(0)',
            opacity: isUsed ? 0 : 1,
            maxHeight: isUsed ? '0px' : '200px',
            overflow: 'hidden'
          }}>
            <div style={{ marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', fontWeight: 'bold' }}>
              ※店舗スタッフ確認用
            </div>

            {/* スワイプもぎりUI */}
            <div
              ref={sliderRef}
              style={{
                position: 'relative',
                height: '60px',
                background: 'var(--color-background)',
                borderRadius: '30px',
                border: '1px dashed var(--color-border)',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                touchAction: 'none' // スクロール防止
              }}
              onMouseMove={(e) => updateSwipe(e.clientX)}
              onTouchMove={(e) => updateSwipe(e.touches[0].clientX)}
            >
              <div style={{
                position: 'absolute',
                left: 0,
                top: 0,
                height: '100%',
                width: `${swipeProgress}%`,
                background: 'var(--color-primary)',
                opacity: 0.2,
                transition: isDragging ? 'none' : 'width 0.3s ease'
              }} />

              <div style={{
                position: 'absolute',
                zIndex: 1,
                color: 'var(--color-text-muted)',
                fontWeight: 'bold',
                pointerEvents: 'none',
                letterSpacing: '1px'
              }}>
                スワイプしてクーポンを利用する▶
              </div>

              <div
                onMouseDown={(e) => { setIsDragging(true); updateSwipe(e.clientX); }}
                onTouchStart={(e) => { setIsDragging(true); updateSwipe(e.touches[0].clientX); }}
                style={{
                  position: 'absolute',
                  left: `calc(${swipeProgress}% - ${swipeProgress === 100 ? 60 : swipeProgress / 100 * 60}px)`,
                  top: '4px',
                  width: '52px',
                  height: '52px',
                  background: 'var(--color-primary)',
                  borderRadius: '26px',
                  cursor: 'grab',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  transition: isDragging ? 'none' : 'left 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '1.5rem'
                }}
              >
                ✂️
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
