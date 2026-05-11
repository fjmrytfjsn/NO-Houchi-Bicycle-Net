import Link from 'next/link';
import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>NO-Houchi Bicycle Net - ホーム</title>
      </Head>

      <div style={{ textAlign: 'center', padding: 'var(--space-8) 0' }}>
        <div
          style={{
            fontSize: '4rem',
            marginBottom: 'var(--space-4)',
            animation: 'slideUp 0.5s ease-out',
          }}
        >
          🚲
        </div>
        <h1
          style={{
            fontSize: 'var(--text-2xl)',
            fontWeight: 700,
            marginBottom: 'var(--space-2)',
            color: 'var(--color-text)',
          }}
        >
          持ち主用ポータル
        </h1>
        <p
          style={{
            color: 'var(--color-text-secondary)',
            fontSize: 'var(--text-sm)',
            marginBottom: 'var(--space-8)',
            lineHeight: 'var(--leading-normal)',
          }}
        >
          QRコードを読み込んで、放置自転車の
          <br />
          解除手続きを行えます。
        </p>
      </div>

      {/* How It Works */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-8)',
        }}
      >
        {[
          {
            icon: '📱',
            title: 'QRコードをスキャン',
            desc: 'マーカーに貼られたQRコードを読み取ります',
          },
          {
            icon: '🔓',
            title: '仮解除を申請',
            desc: '持ち主であることを宣言し、仮解除します',
          },
          {
            icon: '🎁',
            title: '本解除でクーポンゲット',
            desc: '再度QRを読み取って本解除。クーポンがもらえます',
          },
        ].map((step, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 'var(--space-4)',
              background: 'var(--color-surface)',
              padding: 'var(--space-4) var(--space-5)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-sm)',
              animation: `slideUp 0.4s ease-out ${100 + i * 100}ms backwards`,
            }}
          >
            <span style={{ fontSize: '1.75rem', lineHeight: 1 }}>
              {step.icon}
            </span>
            <div>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 'var(--text-base)',
                  marginBottom: 'var(--space-1)',
                }}
              >
                {step.title}
              </div>
              <div
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                {step.desc}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Test Link */}
      <div style={{ textAlign: 'center' }}>
        <Link
          href="/markers/ABC123"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-3) var(--space-6)',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
            color: 'var(--color-text-inverse)',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            fontSize: 'var(--text-sm)',
            textDecoration: 'none',
            boxShadow: '0 4px 14px rgba(13, 148, 136, 0.3)',
            transition: 'all 0.25s ease',
          }}
        >
          🧪 テスト用: Marker ABC123
        </Link>
        <p
          style={{
            marginTop: 'var(--space-3)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-muted)',
          }}
        >
          ※ 開発用のテストリンクです
        </p>
      </div>
    </>
  );
}
