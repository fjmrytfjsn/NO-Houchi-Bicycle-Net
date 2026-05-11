import type { ReactNode } from 'react';
import styles from './Layout.module.css';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <span className={styles.logo} aria-hidden="true">🚲</span>
          <div>
            <div className={styles.headerTitle}>NO-Houchi Bicycle Net</div>
            <div className={styles.headerSubtitle}>放置自転車通報・解除システム</div>
          </div>
        </div>
      </header>

      <main className={styles.main}>{children}</main>

      <footer className={styles.footer}>
        © {new Date().getFullYear()} NO-Houchi Bicycle Net —{' '}
        <span className={styles.footerLink}>シビックテック・プロトタイプ</span>
      </footer>
    </div>
  );
}
