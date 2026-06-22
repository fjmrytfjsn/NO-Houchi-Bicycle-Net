import Head from 'next/head';
import Link from 'next/link';

export default function ShopsPage() {
  const mockShops = [
    { id: 1, name: '喫茶 うめだロマン', type: 'カフェ・喫茶', distance: '120m' },
    { id: 2, name: 'なにわタコ焼き どんや', type: '軽食', distance: '250m' },
    { id: 3, name: 'お好み焼き てっぱん亭 本店', type: '飲食店', distance: '300m' },
    { id: 4, name: '梅田本通ドラッグストア', type: '日用品', distance: '400m' },
    { id: 5, name: '大衆食堂 なにわ屋', type: '飲食店', distance: '450m' },
    { id: 6, name: 'ベーカリー キタノパン', type: 'ベーカリー', distance: '480m' },
    { id: 7, name: '立ち飲み処 わらい', type: '飲食店', distance: '500m' },
    { id: 8, name: 'ラーメン 梅田ブラック', type: '飲食店', distance: '600m' },
    { id: 9, name: '洋菓子 スイーツウメダ', type: '洋菓子', distance: '650m' },
    { id: 10, name: '青果 梅田フレッシュ', type: 'スーパー・青果', distance: '700m' },
    { id: 11, name: '居酒屋 ええやん亭', type: '飲食店', distance: '750m' },
    { id: 12, name: '古本屋 なにわ書房', type: '書店・雑貨', distance: '800m' },
    { id: 13, name: 'カレーショップ スパイス梅田', type: '飲食店', distance: '850m' },
    { id: 14, name: 'スーパーマーケット ウメダヤ', type: 'スーパー', distance: '900m' },
    { id: 15, name: '定食屋 おかんの味', type: '飲食店', distance: '1.2km' },
  ];

  return (
    <>
      <Head>
        <title>提携店舗一覧 - NO-Houchi Bicycle Net</title>
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
            提携店舗一覧
          </h1>
          <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
            取得したクーポンは以下の店舗でご利用いただけます。
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {mockShops.map((shop) => (
            <div key={shop.id} style={{
              background: 'var(--color-surface)',
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                  <span style={{ 
                    background: 'var(--color-primary)', 
                    color: 'white', 
                    fontSize: '0.7rem', 
                    padding: '2px 6px', 
                    borderRadius: '4px',
                    fontWeight: 'bold'
                  }}>
                    {shop.type}
                  </span>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                    現在地から約 {shop.distance}
                  </span>
                </div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-text)' }}>
                  {shop.name}
                </h3>
              </div>
              <div style={{ fontSize: '1.5rem', opacity: 0.5 }}>🏪</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 'var(--space-8)', textAlign: 'center' }}>
          <button
            onClick={() => window.close()}
            style={{
              padding: 'var(--space-3) var(--space-6)',
              background: 'var(--color-text-muted)',
              color: 'var(--color-text-inverse)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-base)',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            画面を閉じる
          </button>
        </div>
      </div>
    </>
  );
}
