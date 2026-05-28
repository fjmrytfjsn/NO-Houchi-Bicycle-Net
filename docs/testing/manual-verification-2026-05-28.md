# 手動動作確認レポート（2026-05-28）

## 実行環境

- 日付: 2026-05-28
- ブランチ: `codex/admin-dashboard-reverify`
- Node.js: `v22.15.0`
- npm: `10.9.2`
- Backend API: `http://localhost:3000`
- Admin Dashboard: `http://localhost:3002`
- 検証方式: ブラウザ UI の代わりに、セッション付き HTTP リクエストと SSR HTML 確認で主要フローを再確認

## 実行コマンド

| 対象 | コマンド | 結果 |
| --- | --- | --- |
| Backend | `npm install` | 成功 |
| Backend | `docker-compose up -d postgres` | 成功 |
| Backend | `TMPDIR=/tmp DATABASE_URL=postgresql://postgres:postgres@localhost:5432/no_houchi_dev JWT_SECRET=change-me npm run prisma:generate` | 成功 |
| Backend | `TMPDIR=/tmp DATABASE_URL=postgresql://postgres:postgres@localhost:5432/no_houchi_dev JWT_SECRET=change-me npm run prisma:migrate` | 失敗。`prisma migrate dev` が非対話環境に非対応 |
| Backend | `TMPDIR=/tmp DATABASE_URL=postgresql://postgres:postgres@localhost:5432/no_houchi_dev JWT_SECRET=change-me npm run prisma:seed` | 成功 |
| Backend | `TMPDIR=/tmp DATABASE_URL=postgresql://postgres:postgres@localhost:5432/no_houchi_dev JWT_SECRET=change-me npm test -- --run` | 成功。79 tests passed |
| Backend | `TMPDIR=/tmp DATABASE_URL=postgresql://postgres:postgres@localhost:5432/no_houchi_dev JWT_SECRET=change-me npm run build` | 成功 |
| Admin Dashboard | `npm install` | 成功 |
| Admin Dashboard | `TMPDIR=/tmp npm test -- --runInBand` | 成功。46 tests passed |
| Admin Dashboard | `TMPDIR=/tmp npm run type-check` | 成功 |
| Admin Dashboard | `TMPDIR=/tmp npm run lint` | 成功 |
| Admin Dashboard | `TMPDIR=/tmp npm run build` | 成功 |
| Backend 起動 | `TMPDIR=/tmp DATABASE_URL=... JWT_SECRET=change-me PORT=3000 npm start` | 失敗。`localhost:3000` は既存プロセスが使用中 |
| Admin Dashboard 起動 | `TMPDIR=/tmp ADMIN_API_BASE_URL=http://localhost:3000 npm start` | 成功 |

## Admin Dashboard 再確認

| No. | 操作 | 期待結果 | 実結果 |
| --- | --- | --- | --- |
| 1 | 未ログインで `GET /` | `/login?next=%2F` へリダイレクトされる | `307 Temporary Redirect`、`Location: /login?next=%2F` を確認 |
| 2 | `POST /api/session/login` に `admin@example.test / password123` を送信 | セッション cookie が発行され、`redirectTo: /` が返る | 成功 |
| 3 | ログイン後に `GET /` | 通報一覧、サマリー、状態フィルターが表示される | 成功。全件 `9`、未解除 `5`、回収依頼中 `1` を確認 |
| 4 | `GET /?status=resolved` | `resolved` の案件だけに絞り込まれる | 成功。`seed-report-resolved` のみ表示 |
| 5 | `GET /reports/seed-report-resolved` | 詳細、地図リンク、履歴が表示される | 成功。`持ち主が仮解除`、`持ち主が本解除` の履歴を確認 |
| 6 | `GET /unresolved?view=all` | `reported` の未解除案件と回収対象状態が表示される | 成功。自動候補、手動候補、手動除外を確認 |
| 7 | `GET /unresolved?view=candidate` | 回収対象フラグ ON の案件だけに絞り込まれる | 成功 |
| 8 | `PATCH /api/session/reports/collection-candidate` で `seed-report-reported-manual-off` を `true` に更新 | 回収対象フラグが `manual_on` になる | 成功 |
| 9 | `POST /api/session/reports/collection-request` で `seed-report-reported-manual-on` に回収依頼を登録 | ステータスが `collection_requested` になる | 成功 |
| 10 | `PATCH /api/session/reports/collection-result` で `seed-report-reported-manual-on` に `not_found_on_collection` を記録 | ステータスが `not_found_on_collection` になる | 成功 |
| 11 | `POST /api/session/reports/collection-request` → `PATCH /api/session/reports/collection-result` で `seed-report-reported-manual-off` に `collected` を記録 | ステータスが `collected` になり、詳細履歴に追記される | 成功 |
| 12 | `PATCH /api/session/reports/collection-result` で `seed-report-reported-auto-candidate` に `collected` を直接記録 | 事前条件不足ならエラーを返す | `report is not eligible for collection result` を確認 |

## 確認できたこと

- 管理画面のログイン導線は動作し、未ログイン時の SSR リダイレクトも正しい。
- 通報一覧、状態フィルター、通報詳細、未解除案件一覧は Backend API のデータで描画される。
- 回収対象フラグ更新、回収依頼登録、回収結果記録のセッション API は主要経路で動作する。
- `not_found_on_collection` と `collected` の両方で Backend API 側の状態更新を確認できた。
- 結果記録直後の詳細画面は、即時取得では旧状態が返ることがあったが、再取得で最新状態へ追従した。

## 既知の注意点

- `npm run prisma:migrate` は `prisma migrate dev --name init` のため、非対話環境では実行できない。
- `npm run prisma:seed` は upsert で既存データを上書き・追記するだけで、過去の回収依頼履歴や結果履歴を削除しない。
- そのため、seed 投入後でも一部案件に過去の回収依頼/回収結果履歴が残り、初期状態の検証シナリオとは完全一致しない。
- Backend の 3000 番ポートは既存プロセスが使用しており、今回の検証ではその稼働中プロセスを利用した。

## 未実施・制約

- 新しいスクリーンショットの取得は未実施。今回の環境は terminal-only で、ブラウザ操作による画像取得は行っていない。
- 実ブラウザでの見た目確認、クリック操作、ログアウトボタン押下は未実施。
- DB を完全に初期化したクリーン環境での再確認は未実施。

## 差分確認メモ

- 追加・更新対象は `docs/testing/manual-verification-2026-05-28.md`、`docs/operations/admin-dashboard-manual.md`、`docs/operations/PROJECT_STATUS.md`。
- 既存の未追跡ファイル `.tmp-admin-auth-build/` には触れていない。
