import Link from 'next/link';

export function ErrorStatePanel({ message }: { message: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-8) var(--space-4)',
        textAlign: 'center',
        minHeight: '60vh',
      }}
    >
      <div
        style={{
          fontSize: '4rem',
          marginBottom: 'var(--space-4)',
        }}
      >
        ⚠️
      </div>
      <h2
        style={{
          fontSize: 'var(--text-xl)',
          fontWeight: 700,
          color: 'var(--color-error)',
          marginBottom: 'var(--space-4)',
        }}
      >
        {message}
      </h2>
      <p
        style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-secondary)',
          lineHeight: 'var(--leading-relaxed)',
          marginBottom: 'var(--space-8)',
        }}
      >
        無効なQRコードを読み込んだか、すでに回収や対応が完了している可能性があります。
        <br />
        正しいURLにアクセスしているか再度ご確認ください。
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', width: '100%', maxWidth: '300px' }}>
        <Link
          href="/"
          style={{
            display: 'block',
            padding: 'var(--space-3)',
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-text-inverse)',
            textDecoration: 'none',
            fontWeight: 600,
            borderRadius: 'var(--radius-md)',
            textAlign: 'center',
          }}
        >
          トップページへ戻る
        </Link>
        <Link
          href="/help"
          style={{
            display: 'block',
            padding: 'var(--space-3)',
            backgroundColor: 'transparent',
            color: 'var(--color-primary)',
            textDecoration: 'none',
            fontWeight: 600,
            borderRadius: 'var(--radius-md)',
            border: '2px solid var(--color-primary)',
            textAlign: 'center',
          }}
        >
          ヘルプを見る
        </Link>
      </div>
    </div>
  );
}
