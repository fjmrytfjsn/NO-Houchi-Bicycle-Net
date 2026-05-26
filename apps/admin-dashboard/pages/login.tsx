import Head from 'next/head';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { getAdminSessionToken, normalizeNextPath } from '../lib/adminSession';

type LoginPageProps = {
  nextPath?: string;
};

export default function LoginPage({ nextPath = '/' }: LoginPageProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/session/login', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          next: nextPath,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { redirectTo?: string; error?: string }
        | null;

      if (!response.ok) {
        setErrorMessage(
          payload?.error === 'invalid credentials'
            ? 'メールアドレスまたはパスワードが正しくありません。'
            : 'ログインに失敗しました。時間を置いて再試行してください。',
        );
        return;
      }

      await router.push(payload?.redirectTo ?? nextPath ?? '/');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Head>
        <title>管理者ログイン | Admin Dashboard</title>
      </Head>
      <main className="auth-shell">
        <section className="auth-card">
          <p className="eyebrow">NO-Houchi Bicycle Net</p>
          <h1>管理者ログイン</h1>
          <p className="panel-meta">管理画面を利用するにはログインが必要です。</p>
          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="form-field">
              <span>メールアドレス</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
                required
              />
            </label>
            <label className="form-field">
              <span>パスワード</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </label>
            {errorMessage ? (
              <p className="auth-error" role="alert">
                {errorMessage}
              </p>
            ) : null}
            <button type="submit" className="button-primary auth-submit" disabled={isSubmitting}>
              {isSubmitting ? 'ログイン中…' : 'ログイン'}
            </button>
          </form>
        </section>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<LoginPageProps> = async ({ query, req }) => {
  if (getAdminSessionToken(req.headers.cookie)) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  return {
    props: {
      nextPath: normalizeNextPath(query.next),
    },
  };
};
