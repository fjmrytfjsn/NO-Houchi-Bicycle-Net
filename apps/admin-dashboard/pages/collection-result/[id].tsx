import type { GetServerSideProps } from 'next';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { AppLayout } from '../../components/AppLayout';
import { DetailCard } from '../../components/DetailCard';
import { FormScaffold } from '../../components/FormScaffold';
import { fetchAdminReport } from '../../lib/adminReports';
import type { ReportDetail } from '../../lib/types';

type CollectionResultPageProps = {
  report?: ReportDetail;
  errorMessage?: string;
};

export default function CollectionResultPage({
  report,
  errorMessage,
}: CollectionResultPageProps = {}) {
  const router = useRouter();
  const isReady = router.isReady ?? true;
  const [result, setResult] = useState<'collected' | 'not_found_on_collection'>(
    'collected',
  );
  const [memo, setMemo] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isReady) {
    return (
      <AppLayout title="回収結果記録">
        <section className="panel">
          <p>読み込み中…</p>
        </section>
      </AppLayout>
    );
  }

  if (errorMessage || !report) {
    return (
      <AppLayout title="回収結果記録">
        <section className="panel">
          <p>{errorMessage ?? '対象の通報が見つかりません。'}</p>
        </section>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="回収結果記録">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setSuccessMessage(
            `結果を記録しました。選択結果: ${result} / メモ: ${memo || 'なし'}`,
          );
        }}
      >
        <FormScaffold
          title="対象概要"
          confirmation="記録後は collected または not_found_on_collection の完了状態として扱います。"
          successMessage={successMessage}
          submitLabel="結果を記録"
          cancelHref={`/reports/${report.id}`}
          fields={
            <>
              <fieldset className="form-fieldset">
                <legend>結果選択</legend>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="collection-result"
                    checked={result === 'collected'}
                    onChange={() => setResult('collected')}
                  />
                  <span>回収完了</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="collection-result"
                    checked={result === 'not_found_on_collection'}
                    onChange={() => setResult('not_found_on_collection')}
                  />
                  <span>現地で現物なし</span>
                </label>
              </fieldset>
              <label className="form-field">
                <span>結果メモ</span>
                <textarea
                  value={memo}
                  onChange={(event) => setMemo(event.target.value)}
                  placeholder="回収業者からの現地結果を記録"
                  rows={5}
                />
              </label>
            </>
          }
        >
          <DetailCard report={report} />
        </FormScaffold>
      </form>
    </AppLayout>
  );
}

export const getServerSideProps: GetServerSideProps<CollectionResultPageProps> = async ({
  params,
}) => {
  const id = typeof params?.id === 'string' ? params.id : undefined;

  if (!id) {
    return {
      props: {
        errorMessage: '対象の通報が見つかりません。',
      },
    };
  }

  try {
    const report = await fetchAdminReport(id);

    return {
      props: {
        report,
      },
    };
  } catch (error) {
    return {
      props: {
        errorMessage:
          '回収結果対象を取得できませんでした。Backend API の起動状態を確認してください。',
      },
    };
  }
};
