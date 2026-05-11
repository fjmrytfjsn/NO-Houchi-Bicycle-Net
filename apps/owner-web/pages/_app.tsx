import '../styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { Layout } from '../components/Layout';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="description"
          content="放置自転車の通報・解除を行うシビックテックサービス"
        />
        <title>NO-Houchi Bicycle Net - 持ち主用</title>
      </Head>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </>
  );
}
