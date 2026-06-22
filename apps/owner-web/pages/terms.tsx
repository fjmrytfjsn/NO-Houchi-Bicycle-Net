import Head from 'next/head';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <>
      <Head>
        <title>クーポン利用規約 - NO-Houchi Bicycle Net</title>
      </Head>

      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        padding: 'var(--space-6) var(--space-4)',
        minHeight: '100vh',
        background: 'var(--color-background)'
      }}>
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <h1 style={{ margin: '0 0 var(--space-2) 0', fontSize: '1.5rem', color: 'var(--color-text)' }}>
            クーポン利用規約
          </h1>
          <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
            最終更新日: 2026年6月15日
          </p>
        </div>

        <div style={{
          background: 'var(--color-surface)',
          padding: 'var(--space-6)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          lineHeight: '1.6',
          color: 'var(--color-text)',
          fontSize: 'var(--text-base)'
        }}>
          <h2 style={{ fontSize: '1.2rem', marginTop: 0, marginBottom: 'var(--space-3)' }}>1. クーポンの利用目的と制限</h2>
          <p style={{ marginBottom: 'var(--space-4)' }}>
            本クーポンは、違法駐輪および放置自転車の早期撤去を促進する目的で発行されます。クーポンの取得から15分以内に指定の提携店舗にて商品を購入する際、またはサービスを利用する際の一部代金としてご利用いただけます。
          </p>

          <h2 style={{ fontSize: '1.2rem', marginTop: 'var(--space-5)', marginBottom: 'var(--space-3)' }}>2. 有効期限</h2>
          <p style={{ marginBottom: 'var(--space-4)' }}>
            本クーポンの有効期限は、発行（「はい（コードを表示する）」ボタンの押下）から<strong>厳密に15分間</strong>です。いかなる理由があっても、有効期限を過ぎたクーポンは無効となり、再発行は致しかねます。
          </p>

          <h2 style={{ fontSize: '1.2rem', marginTop: 'var(--space-5)', marginBottom: 'var(--space-3)' }}>3. 発行制限</h2>
          <p style={{ marginBottom: 'var(--space-4)' }}>
            本クーポンの取得は、携帯電話番号1つにつき<strong>月に1回まで</strong>とさせていただきます。複数回にわたる意図的な取得や、不正な手段での取得が発覚した場合、以後のサービス利用をお断りする場合がございます。
          </p>

          <h2 style={{ fontSize: '1.2rem', marginTop: 'var(--space-5)', marginBottom: 'var(--space-3)' }}>4. 利用方法と免責事項</h2>
          <ul style={{ paddingLeft: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
            <li style={{ marginBottom: 'var(--space-2)' }}>本クーポンは、提携店舗でのみご利用可能です。</li>
            <li style={{ marginBottom: 'var(--space-2)' }}>現金への換金、または釣銭の支払いはできません。</li>
            <li style={{ marginBottom: 'var(--space-2)' }}>店舗スタッフが確認する前に、ご自身で「利用済みにする」操作（スワイプ）を行った場合、クーポンは消費されたものとみなされ、無効となります。</li>
            <li style={{ marginBottom: 'var(--space-2)' }}>通信障害や端末の不具合によりクーポンが提示できなかった場合でも、補償や期限の延長は行いません。</li>
          </ul>
        </div>

        <div style={{ marginTop: 'var(--space-8)', textAlign: 'center' }}>
          <button
            onClick={() => window.close()}
            style={{
              padding: 'var(--space-3) var(--space-6)',
              background: 'var(--color-primary)',
              color: 'var(--color-text-inverse)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-base)',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            閉じる
          </button>
        </div>
      </div>
    </>
  );
}
