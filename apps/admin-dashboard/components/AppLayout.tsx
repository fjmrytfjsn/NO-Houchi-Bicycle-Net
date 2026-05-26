import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import type { PropsWithChildren, ReactNode } from 'react';

interface AppLayoutProps extends PropsWithChildren {
  title: string;
  actions?: ReactNode;
}

const navItems = [
  { href: '/', label: '通報一覧' },
  { href: '/unresolved', label: '回収依頼候補' },
];

export function AppLayout({
  title,
  actions,
  children,
}: AppLayoutProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await fetch('/api/session/logout', {
        method: 'POST',
      });
      await router.push('/login');
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <>
      <Head>
        <title>{`${title} | Admin Dashboard`}</title>
      </Head>
      <div className="app-shell">
        <aside className="sidebar">
          <div className="brand-block">
            <p className="eyebrow">NO-Houchi Bicycle Net</p>
            <h1>管理者ダッシュボード</h1>
          </div>
          <nav className="side-nav" aria-label="グローバルナビゲーション">
            {navItems.map((item) => {
              const isActive = router.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={isActive ? 'nav-link active' : 'nav-link'}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="content">
          <header className="page-header">
            <div>
              <p className="eyebrow">運用画面</p>
              <h2>{title}</h2>
            </div>
            <div className="header-actions">
              {actions}
              <button type="button" onClick={handleLogout} disabled={isLoggingOut}>
                {isLoggingOut ? 'ログアウト中…' : 'ログアウト'}
              </button>
            </div>
          </header>
          {children}
        </main>
      </div>
    </>
  );
}
