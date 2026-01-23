import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ padding: 20 }}>
      <h1>Owner Web (Development)</h1>
      <p>QR でアクセスした際に到達するページのプロトタイプです。</p>
      <p>
        テスト用: <Link href="/markers/ABC123">Marker ABC123</Link>
      </p>
    </main>
  );
}
