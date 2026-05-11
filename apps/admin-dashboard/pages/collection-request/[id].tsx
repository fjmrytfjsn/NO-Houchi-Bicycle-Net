import type { GetServerSideProps } from 'next';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { AppLayout } from '../../components/AppLayout';
import { DetailCard } from '../../components/DetailCard';
import { FormScaffold } from '../../components/FormScaffold';
import { fetchAdminReport } from '../../lib/adminReports';
import type { ReportDetail } from '../../lib/types';

type CollectionRequestPageProps = {
  report?: ReportDetail;
  errorMessage?: string;
};

export default function CollectionRequestPage({
  report,
  errorMessage,
}: CollectionRequestPageProps = {}) {
  const router = useRouter();
  const isReady = router.isReady ?? true;
  const [memo, setMemo] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isReady) {
    return (
      <AppLayout title="回収依頼">
        <section className="panel">
          <p>読み込み中…</p>
        </section>
      </AppLayout>
    );
  }

  if (errorMessage || !report) {
    return (
      <AppLayout title="回収依頼">
        <section className="panel">
          <p>{errorMessage ?? '対象の通報が見つかりません。'}</p>
        </section>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="回収依頼">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setSuccessMessage(
            `回収依頼を登録しました。入力メモ: ${memo || 'なし'}`,
          );
        }}
      >
        <FormScaffold
          title="対象概要"
          confirmation="確認: collection_requested に更新"
          successMessage={successMessage}
          submitLabel="回収依頼登録"
          cancelHref="/unresolved"
          fields={
            <label className="form-field">
              <span>依頼メモ</span>
              <textarea
                value={memo}
                onChange={(event) => setMemo(event.target.value)}
                placeholder="回収依頼時の補足を入力"
                rows={5}
              />
            </label>
          }
        >
          <DetailCard report={report} />
        </FormScaffold>
      </form>
    </AppLayout>
  );
}

export const getServerSideProps: GetServerSideProps<CollectionRequestPageProps> = async ({
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
          '回収依頼対象を取得できませんでした。Backend API の起動状態を確認してください。',
      },
    };
  }
};
