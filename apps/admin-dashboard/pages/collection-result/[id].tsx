import type { GetServerSideProps } from 'next';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { AppLayout } from '../../components/AppLayout';
import { DetailCard } from '../../components/DetailCard';
import { FormScaffold } from '../../components/FormScaffold';
import { fetchAdminReport, recordCollectionResult } from '../../lib/adminReports';
import { withAdminPageAuth } from '../../lib/adminSession';
import type { ReportDetail } from '../../lib/types';

type CollectionResultPageProps = {
  report?: ReportDetail;
  errorMessage?: string;
};

export default function CollectionResultPage({
  report: initialReport,
  errorMessage,
}: CollectionResultPageProps = {}) {
  const router = useRouter();
  const isReady = router.isReady ?? true;
  const [report, setReport] = useState(initialReport);
  const [result, setResult] = useState<'collected' | 'not_found_on_collection'>(
    'collected',
  );
  const [memo, setMemo] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const isEligible = report.status === 'collection_requested';
  const isCompleted =
    report.status === 'collected' || report.status === 'not_found_on_collection';
  const eligibilityErrorMessage = !isEligible && !isCompleted
    ? 'この通報は回収結果記録の対象外です。最新状態を確認してください。'
    : null;

  return (
    <AppLayout title="回収結果記録">
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          if (!isEligible || isSubmitting) {
            return;
          }

          setIsSubmitting(true);
          setSubmitError(null);
          setSuccessMessage(null);

          try {
            const updatedReport = await recordCollectionResult(report.id, result, memo);
            setReport((currentReport) =>
              currentReport
                ? {
                    ...currentReport,
                    ...updatedReport,
                    history: currentReport.history,
                  }
                : currentReport,
            );
            setSuccessMessage(
              result === 'collected'
                ? '回収結果を記録しました（回収完了）'
                : '回収結果を記録しました（現地で現物なし）',
            );
          } catch (error) {
            if (error instanceof Error && error.name === 'AdminSessionUnauthorizedError') {
              await router.push(`/login?next=${encodeURIComponent(`/collection-result/${report.id}`)}`);
              return;
            }

            setSubmitError(
              error instanceof Error && error.message
                ? error.message
                : '回収結果を記録できませんでした。Backend API の起動状態を確認してください。',
            );
          } finally {
            setIsSubmitting(false);
          }
        }}
      >
        <FormScaffold
          title="対象概要"
          confirmation="記録後は collected または not_found_on_collection の完了状態として扱います。"
          successMessage={successMessage}
          errorMessage={submitError ?? eligibilityErrorMessage}
          submitLabel="結果を記録"
          cancelHref={`/reports/${report.id}`}
          submitDisabled={!isEligible || isSubmitting}
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
                  disabled={!isEligible || isSubmitting}
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
  ...context
}) => {
  const id = typeof params?.id === 'string' ? params.id : undefined;

  if (!id) {
    return {
      props: {
        errorMessage: '対象の通報が見つかりません。',
      },
    };
  }

  return withAdminPageAuth<CollectionResultPageProps>(
    {
      params,
      ...context,
    } as never,
    async (token) => {
      try {
        const report = await fetchAdminReport(id, token);

        return {
          props: {
            report,
          },
        };
      } catch (error) {
        if (error instanceof Error && error.name === 'AdminSessionUnauthorizedError') {
          throw error;
        }
        return {
          props: {
            errorMessage:
              '回収結果対象を取得できませんでした。Backend API の起動状態を確認してください。',
          },
        };
      }
    },
  );
};
