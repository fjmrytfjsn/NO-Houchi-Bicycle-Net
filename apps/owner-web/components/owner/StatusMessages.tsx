interface StatusMessagesProps {
  loading: boolean;
  error: string | null;
  info: string | null;
  hasData: boolean;
}

export function StatusMessages({
  loading,
  error,
  info,
  hasData,
}: StatusMessagesProps) {
  return (
    <>
      {loading && <p>読み込み中…</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {info && <p style={{ color: 'green' }}>{info}</p>}
      {!hasData && !loading && !error && <p>データがありません</p>}
    </>
  );
}
