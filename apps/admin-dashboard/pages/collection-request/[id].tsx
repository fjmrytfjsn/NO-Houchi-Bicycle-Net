import { useState } from 'react';
import { useRouter } from 'next/router';
import { AppLayout } from '../../components/AppLayout';
import { DetailCard } from '../../components/DetailCard';
import { FormScaffold } from '../../components/FormScaffold';
import { getReportById } from '../../lib/mockReports';

export default function CollectionRequestPage() {
  const router = useRouter();
  const isReady = router.isReady ?? true;
  const report = isReady ? getReportById(router.query.id) : undefined;
  const [memo, setMemo] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isReady) {
    return (
      <AppLayout
        title="回収依頼"
        description="対象案件に依頼メモを付け、回収依頼状態へ更新する雛形です。"
      >
        <section className="panel">
          <p>読み込み中…</p>
        </section>
      </AppLayout>
    );
  }

  if (!report) {
    return (
      <AppLayout
        title="回収依頼"
        description="対象の通報情報が見つかりませんでした。"
      >
        <section className="panel">
          <p>対象の通報が見つかりません。</p>
        </section>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="回収依頼"
      description="対象案件に依頼メモを付け、回収依頼状態へ更新する雛形です。"
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setSuccessMessage(
            `回収依頼を登録しました（モック）。入力メモ: ${memo || 'なし'}`,
          );
        }}
      >
        <FormScaffold
          title="対象概要"
          description="対象通報の取り違えを避けるため、概要を確認してから登録します。"
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
