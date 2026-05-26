import Head from 'next/head';
import Link from 'next/link';

export default function HelpPage() {
  return (
    <>
      <Head>
        <title>NO-Houchi Bicycle Net - ヘルプ</title>
      </Head>

      <div style={{ padding: 'var(--space-6) 0' }}>
        <h1
          style={{
            fontSize: 'var(--text-xl)',
            fontWeight: 700,
            marginBottom: 'var(--space-6)',
            color: 'var(--color-text)',
            textAlign: 'center',
          }}
        >
          ヘルプ・お問い合わせ
        </h1>

        <section style={{ marginBottom: 'var(--space-8)' }}>
          <h2
            style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 600,
              marginBottom: 'var(--space-4)',
              color: 'var(--color-primary)',
              borderBottom: '2px solid var(--color-surface)',
              paddingBottom: 'var(--space-2)',
            }}
          >
            よくあるご質問（FAQ）
          </h2>

          <div style={{ marginBottom: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
              Q. なぜ「仮解除」と「本解除」の2段階があるのですか？
            </h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
              A. イタズラによる遠隔からの解除を防ぎ、持ち主の方が「本当に現地で自転車を確認したか」を担保するためです。仮解除から一定時間経過後に、再度QRコードを読み込むことで本解除となります。
            </p>
          </div>

          <div style={{ marginBottom: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
              Q. 自転車に貼られたQRコードがかすれて読み取れません
            </h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
              A. 現在、カメラを使わずに手動でコードを入力する機能を準備中です。恐れ入りますが、お急ぎの場合は下記のお問い合わせ先までご連絡ください。
            </p>
          </div>

          <div style={{ marginBottom: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
              Q. 自分の自転車ではないのに通報されています
            </h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
              A. 誤通報の可能性があります。そのまま放置せず、下記のお問い合わせ窓口へご相談ください。
            </p>
          </div>
        </section>

        <section style={{ marginBottom: 'var(--space-8)' }}>
          <h2
            style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 600,
              marginBottom: 'var(--space-4)',
              color: 'var(--color-primary)',
              borderBottom: '2px solid var(--color-surface)',
              paddingBottom: 'var(--space-2)',
            }}
          >
            お問い合わせ先
          </h2>
          <div
            style={{
              background: 'var(--color-surface)',
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <p style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
              北区自転車対策コールセンター
            </p>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)' }}>
              電話番号： 06-XXXX-XXXX
            </p>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
              受付時間： 平日 9:00 〜 17:00
            </p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-3)' }}>
              ※これはデモ用の架空の連絡先です。実際には発信しないでください。
            </p>
          </div>
        </section>

        <div style={{ textAlign: 'center' }}>
          <Link
            href="/"
            style={{
              display: 'inline-block',
              padding: 'var(--space-3) var(--space-6)',
              backgroundColor: 'transparent',
              color: 'var(--color-primary)',
              textDecoration: 'none',
              fontWeight: 600,
              borderRadius: 'var(--radius-full)',
              border: '2px solid var(--color-primary)',
              transition: 'background-color 0.2s',
            }}
          >
            トップページへ戻る
          </Link>
        </div>
      </div>
    </>
  );
}
