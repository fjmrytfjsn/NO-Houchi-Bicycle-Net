import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { PropsWithChildren, ReactNode } from 'react';

interface AppLayoutProps extends PropsWithChildren {
  title: string;
  description: string;
  actions?: ReactNode;
}

const navItems = [
  { href: '/', label: '通報一覧' },
  { href: '/unresolved', label: '未解除案件' },
];

export function AppLayout({
  title,
  description,
  actions,
  children,
}: AppLayoutProps) {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>{title} | Admin Dashboard</title>
      </Head>
      <div className="app-shell">
        <aside className="sidebar">
          <div className="brand-block">
            <p className="eyebrow">NO-Houchi Bicycle Net</p>
            <h1>管理者ダッシュボード</h1>
            <p className="brand-description">
              通報状況の確認、未解除案件の回収依頼、回収結果の記録を行う管理画面の雛形です。
            </p>
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
              <p className="page-description">{description}</p>
            </div>
            {actions ? <div className="header-actions">{actions}</div> : null}
          </header>
          {children}
        </main>
      </div>
    </>
  );
}
