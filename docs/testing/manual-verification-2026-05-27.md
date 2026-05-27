# 手動動作確認レポート（2026-05-27）

## 実行環境

- 日付: 2026-05-27
- ブランチ: `codex/admin-dashboard-manual-20260527`
- Node.js: `v22.15.0`
- npm: `10.9.2`
- Backend API: `http://localhost:3000`
- Admin Dashboard: `http://localhost:3002`
- スクリーンショット保存先: `docs/testing/screenshots/2026-05-27/`

## 対象

- 管理者ログイン
- 通報一覧
- 通報詳細
- 未解除案件一覧
- 回収依頼
- 回収結果記録（`not_found_on_collection` / `collected`）

## 実行コマンド

| 対象 | コマンド | 結果 |
| --- | --- | --- |
| DB | `docker-compose up -d postgres` | 成功。Postgres コンテナ起動済みを確認。 |
| Backend | `npx prisma generate` | 成功。 |
| Backend | `npx prisma migrate deploy` | 失敗。既存DBが非空のため `P3005`。今回の確認では既存スキーマをそのまま使用。 |
| Backend | `npx prisma db seed` | 成功。seed データ投入。途中で状態を戻すため再実行も実施。 |
| Backend | `npm run dev` | 成功。`http://localhost:3000` で起動。 |
| Admin Dashboard | `npm run dev` | 成功。`http://localhost:3002` で起動。 |
| Backend | `TMPDIR=/tmp npm test -- --run` | 失敗。`test/owner.spec.ts` の 2 件が期待値不一致で失敗。詳細は「自動検証結果」を参照。 |
| Admin Dashboard | `TMPDIR=/tmp npm test -- --runInBand` | 成功。46 tests passed。 |
| Admin Dashboard | `TMPDIR=/tmp npm run type-check` | 成功。 |
| Admin Dashboard | `TMPDIR=/tmp npm run lint` | 成功。 |
| Admin Dashboard | `TMPDIR=/tmp npm run build` | 成功。 |

## 手動動作確認

| No. | 操作 | 期待結果 | 実結果 | スクリーンショット |
| --- | --- | --- | --- | --- |
| 1 | 未ログインで `/login` を表示 | ログインフォームが表示される | `管理者ログイン` 画面が表示された | ![](./screenshots/2026-05-27/admin-01-login.png) |
| 2 | seed 管理者アカウントでログイン | `/` に遷移し、通報一覧が表示される | 遷移してサマリーと一覧が表示された | ![](./screenshots/2026-05-27/admin-02-list-all.png) |
| 3 | 状態フィルター `resolved` を選択 | `?status=resolved` で一覧が絞り込まれる | `resolved` 一覧へ切り替わった | ![](./screenshots/2026-05-27/admin-03-list-resolved.png) |
| 4 | `seed-report-reported-manual-on` の詳細を表示 | 写真、位置、識別情報、現在ステータス、導線が表示される | 通報詳細が表示され、未解除案件導線も表示された | ![](./screenshots/2026-05-27/admin-04-report-detail-reported.png) |
| 5 | `/unresolved?view=all` を表示 | `reported` 全件と回収対象状態が表示される | 自動候補、手動候補、手動除外を含む一覧が表示された | ![](./screenshots/2026-05-27/admin-05-unresolved-all.png) |
| 6 | `/unresolved?view=candidate` を表示 | 回収対象フラグ ON の案件だけが表示される | 候補案件のみが表示された | ![](./screenshots/2026-05-27/admin-06-unresolved-candidate.png) |
| 7 | `seed-report-reported-auto-candidate` の回収依頼画面を表示 | 対象概要と依頼メモ入力欄が表示される | 表示された | ![](./screenshots/2026-05-27/admin-07-collection-request-initial.png) |
| 8 | 依頼メモを入力して `回収依頼登録` を押下 | 詳細画面へ戻り、`collection_requested` になる | 詳細画面へ遷移し、`collection_requested` 表示になった | ![](./screenshots/2026-05-27/admin-08-collection-request-submitted-detail.png) |
| 9 | 同案件の回収結果記録画面を表示 | 結果選択と結果メモ入力欄が表示される | 表示された | ![](./screenshots/2026-05-27/admin-09-collection-result-not-found-initial.png) |
| 10 | `現地で現物なし` を選択して `結果を記録` を押下 | 成功メッセージが表示される | `回収結果を記録しました（現地で現物なし）` が表示された | ![](./screenshots/2026-05-27/admin-10-collection-result-not-found-submitted.png) |
| 11 | seed を再投入し、`seed-report-reported-manual-on` を回収依頼後に回収結果記録画面を表示 | `collected` 記録前の初期画面が表示される | 表示された | ![](./screenshots/2026-05-27/admin-11-collection-result-collected-initial.png) |
| 12 | `回収完了` を選択して `結果を記録` を押下 | 成功メッセージが表示される | `回収結果を記録しました（回収完了）` が表示された。あわせて対象外エラーも同時表示された | ![](./screenshots/2026-05-27/admin-12-collection-result-collected-submitted.png) |

## 自動検証結果

### Backend

- `TMPDIR=/tmp npm test -- --run`: 失敗
- 失敗内容
  - `test/owner.spec.ts > creates a temporary unlock declaration`
    - `expiresAt` の期待値が `2026-04-21T09:00:00.000Z` だが、実際は `2026-04-21T09:15:00.000Z`
  - `test/owner.spec.ts > returns 409 when final unlock is attempted after temporary unlock expiry`
    - 期待 `409` に対して実際は `200`

### Admin Dashboard

- `TMPDIR=/tmp npm test -- --runInBand`: 成功（46 tests passed）
- `TMPDIR=/tmp npm run type-check`: 成功
- `TMPDIR=/tmp npm run lint`: 成功
- `TMPDIR=/tmp npm run build`: 成功

## 既知の注意点

- `npx prisma migrate deploy` は、既にデータが入っているローカル DB に対して `P3005` で停止した。今回の確認は既存スキーマと `npx prisma db seed` により進めた。
- `回収完了` を記録した直後、成功メッセージと同時に `この通報は回収結果記録の対象外です。最新状態を確認してください。` が表示される。状態更新自体は成功しているため、UI 側の既知不具合と判断した。
- 外部画像 URL が利用できない場合、写真は `PHOTO` プレースホルダー表示になる。

## 未実施・制約

- Google Maps 埋め込みの実表示は、公開 API キー未設定のため確認対象外とした。
- Backend テスト失敗 2 件の原因切り分けと修正は今回未対応。

## 差分確認メモ

- 本作業の新規成果物は本レポート、運用マニュアル、`docs/testing/screenshots/2026-05-27/admin-*.png`。
- 同ディレクトリには既存の `issue-43-*`、`issue-44-*` スクリーンショットも存在するが、本レポートでは `admin-*` のみを参照した。
