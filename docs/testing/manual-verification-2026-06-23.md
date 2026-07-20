# 手動動作確認レポート（2026-06-23）

## 実行環境

- 日付: 2026-06-23
- ブランチ: `codex/manual-verification-20260623`
- Node.js: `v22.15.0`
- npm: `10.9.2`
- PostgreSQL: `postgresql://postgres:postgres@localhost:5432/no_houchi_dev`
- Backend API: `http://127.0.0.1:3000`
- Admin Dashboard: `http://127.0.0.1:3002`
- 検証方式:
  - Backend API: 権限付きローカル HTTP リクエスト
  - Admin Dashboard: Playwright + Chromium によるブラウザ操作とスクリーンショット取得
  - 自動チェック: `backend` の Vitest / build、`apps/admin-dashboard` の Jest / type-check / lint / build

## 使用データ

### seed データ

- 管理者ログイン: `admin@example.test / password123`
- 管理画面で主に使った seed レコード:
  - `seed-report-resolved`
  - `seed-report-reported-manual-on`
  - `seed-report-reported-manual-off`
  - `seed-marker-reported` (`SEED-REP-001`)
  - `seed-marker-temporary` (`SEED-TMP-001`)

### API 検証で新規作成した主なレコード

- API-01 通報登録: `5ee5597b-bb01-4869-8a51-70a8b522bd54`
- API-06/07 持ち主解除フロー: `599ea36e-fce9-47b5-8d9f-91ced4b3eb74`
- API-10 回収依頼フロー: `7b1abbb9-0bce-4298-a18b-89f62a6c159f`
- API-11 回収完了フロー: `6327e2ea-c99a-41dc-b042-952890bce07a`
- API-11 現地で現物なしフロー: `36363f19-96e2-4895-87dd-92bd1bed739a`

詳細な入出力は [api-results.json](./artifacts/2026-06-23/api-results.json)、[admin-ui-results.json](./artifacts/2026-06-23/admin-ui-results.json)、[admin-http-results.json](./artifacts/2026-06-23/admin-http-results.json) を参照。

## 実行コマンド

| 対象 | コマンド | 結果 |
| --- | --- | --- |
| DB | `cd backend && docker-compose up -d postgres` | 成功 |
| Backend | `TMPDIR=/tmp DATABASE_URL=postgresql://postgres:postgres@localhost:5432/no_houchi_dev JWT_SECRET=change-me npm run prisma:generate` | 成功 |
| Backend | `TMPDIR=/tmp DATABASE_URL=postgresql://postgres:postgres@localhost:5432/no_houchi_dev JWT_SECRET=change-me npx prisma migrate deploy` | 成功 |
| Backend | `TMPDIR=/tmp DATABASE_URL=postgresql://postgres:postgres@localhost:5432/no_houchi_dev JWT_SECRET=change-me npm run prisma:seed` | 成功 |
| Backend | `TMPDIR=/tmp DATABASE_URL=postgresql://postgres:postgres@localhost:5432/no_houchi_dev JWT_SECRET=change-me npm test -- --run` | 成功（79 tests passed） |
| Backend | `TMPDIR=/tmp DATABASE_URL=postgresql://postgres:postgres@localhost:5432/no_houchi_dev JWT_SECRET=change-me npm run build` | 成功 |
| Admin | `TMPDIR=/tmp npm test -- --runInBand` | 成功（46 tests passed） |
| Admin | `TMPDIR=/tmp npm run type-check` | 成功 |
| Admin | `TMPDIR=/tmp npm run lint` | 成功 |
| Admin | `TMPDIR=/tmp npm run build` | 成功 |
| Backend 起動 | `TMPDIR=/tmp DATABASE_URL=postgresql://postgres:postgres@localhost:5432/no_houchi_dev JWT_SECRET=change-me PORT=3000 npm run dev` | 成功 |
| Admin 起動 | `TMPDIR=/tmp ADMIN_API_BASE_URL=http://localhost:3000 npm run dev` | 成功 |
| Screenshot 環境 | `npx -y playwright@1.53.0 install chromium` | 成功 |
| API 証跡取得 | `node` スクリプトで `docs/testing/artifacts/2026-06-23/api-results.json` を生成 | 成功 |
| UI 証跡取得 | Playwright スクリプトで `docs/testing/screenshots/2026-06-23/` と `admin-ui-results.json` を生成 | 成功 |

## 管理者ダッシュボード結果

| テストID | 使用データ | 実結果 | 証跡 |
| --- | --- | --- | --- |
| ADM-01 | `admin@example.test / password123` | 成功。ログイン画面表示後、セッション作成され通報一覧へ遷移。 | [login画面](./screenshots/2026-06-23/admin-01-login.png), [一覧遷移後](./screenshots/2026-06-23/admin-02-list-all.png), [login API](./artifacts/2026-06-23/admin-http-results.json) |
| ADM-02 | seed + API 検証で追加した通報データ | 成功。写真サムネイル、通報日時、位置、識別情報、状態を一覧表示。 | [admin-02-list-all.png](./screenshots/2026-06-23/admin-02-list-all.png) |
| ADM-03 | `status=resolved` | 成功。`resolved` のみ表示。 | [admin-03-list-resolved.png](./screenshots/2026-06-23/admin-03-list-resolved.png) |
| ADM-04 | `seed-report-resolved` | 成功。写真、位置、識別情報、現在ステータス、履歴を確認。 | [admin-04-report-detail-resolved.png](./screenshots/2026-06-23/admin-04-report-detail-resolved.png) |
| ADM-05 | `reported` 案件群 | 成功。`reported全件` と `回収対象のみ` を切り替えて確認。 | [全件](./screenshots/2026-06-23/admin-05-unresolved-all.png), [候補のみ](./screenshots/2026-06-23/admin-06-unresolved-candidate.png) |
| ADM-06 | `seed-report-reported-manual-off` | 成功。`回収対象にする` 操作で候補化され、候補一覧に反映。 | [admin-06-unresolved-candidate.png](./screenshots/2026-06-23/admin-06-unresolved-candidate.png), [session API](./artifacts/2026-06-23/admin-ui-results.json) |
| ADM-07 | `seed-report-reported-manual-on` | 成功。依頼メモ登録後に `collection_requested` へ更新。 | [入力前](./screenshots/2026-06-23/admin-07-collection-request-initial.png), [登録後](./screenshots/2026-06-23/admin-08-collection-request-submitted-detail.png) |
| ADM-08 | `seed-report-reported-manual-off` | 成功。`collected` を記録し完了表示を確認。 | [入力前](./screenshots/2026-06-23/admin-11-collection-result-collected-initial.png), [登録後](./screenshots/2026-06-23/admin-12-collection-result-collected-submitted.png) |
| ADM-09 | `seed-report-reported-manual-on` | 成功。`not_found_on_collection` を記録し完了表示を確認。 | [入力前](./screenshots/2026-06-23/admin-09-collection-result-not-found-initial.png), [登録後](./screenshots/2026-06-23/admin-10-collection-result-not-found-submitted.png) |
| ADM-10 | セッション未作成状態 | 成功。`GET /` は `307` と `Location: /login?next=%2F` を返却。 | [login画面](./screenshots/2026-06-23/admin-01-login.png), [redirect header](./artifacts/2026-06-23/admin-http-results.json) |

## バックエンド API 結果

| テストID | 対象 API | 使用データ | 実結果 |
| --- | --- | --- | --- |
| API-01 | `POST /api/reports` | 新規 `TEST-...-API01` | 成功。`201` で `reported` 通報を作成。 |
| API-02 | `POST /api/reports` | `imageUrl=''`, `latitude=999` | 成功。`400`、`imageUrl required` を返却。 |
| API-03 | `GET /api/reports`, `GET /api/reports?status=reported` | 全件 + `reported` 絞り込み | 成功。全件 `19` 件、`reported` `8` 件。絞り込み結果は全件 `reported`。 |
| API-04 | `GET /api/reports/:id` | `seed-report-resolved` | 成功。詳細と履歴 3 件を返却し、履歴は時系列昇順。 |
| API-05 | `GET /owner/markers/:code` | `SEED-REP-001` | 成功。`marker`, 最新 `report`, `declaration=null` を返却。 |
| API-06 | `POST /owner/markers/:code/unlock-temp` | 新規 `TEST-...-OWNER06` | 成功。`temporary` へ更新し、`declaredAt`, `eligibleFinalAt`, `expiresAt` を返却。 |
| API-07 | `POST /owner/markers/:code/unlock-final` | API-06 の同案件 | 成功。`resolved` と `finalizedAt` を返却。クーポン情報も返却。 |
| API-08 | `POST /owner/markers/:code/unlock-final` | 仮解除なし / 時刻未到達 / 期限切れ / コード不一致 | 成功。前 3 ケースは `409`、コード不一致は `400` を返却。 |
| API-09 | `PATCH /api/reports/:id/collection-candidate` | 新規 `reported` 案件 + `seed-report-resolved` | 成功。`reported` は `200` で `manual_on`、`resolved` は `409`。 |
| API-10 | `POST /api/reports/:id/collection-request` | 新規 `reported` 案件 | 成功。`collection_requested` へ更新し候補フラグをクリア。 |
| API-11 | `PATCH /api/reports/:id/collection-result` | 新規 `collection_requested` 案件 2 件 | 成功。`collected` と `not_found_on_collection` の両方を記録。 |
| API-12 | `PATCH /api/reports/:id/collection-result` | 新規 `reported` 案件 | 成功。`409`、`report is not eligible for collection result` を返却。 |
| API-13 | `GET /api/reports/:id` | API-06/07 の案件、API-11 の案件 | 成功。持ち主解除フローと回収フローの履歴が欠落なく取得できた。 |

## 結果データ

### テスト結果サマリー

- 管理者ダッシュボード: `10 / 10` pass
- バックエンド API: `13 / 13` pass
- Backend 自動テスト: `79 / 79` pass
- Admin Dashboard 自動テスト: `46 / 46` pass

### 画面確認時点の一覧件数

- 全件: `27`
- 未解除: `15`
- 回収依頼中: `3`

上記件数は API 手動テストで追加した通報データを含む。

### 主要な状態遷移結果

| フロー | 対象 | 遷移 |
| --- | --- | --- |
| 持ち主解除 | `599ea36e-fce9-47b5-8d9f-91ced4b3eb74` | `reported -> temporary -> resolved` |
| 回収依頼 | `7b1abbb9-0bce-4298-a18b-89f62a6c159f` | `reported -> collection_requested` |
| 回収完了 | `6327e2ea-c99a-41dc-b042-952890bce07a` | `reported -> collection_requested -> collected` |
| 現地で現物なし | `36363f19-96e2-4895-87dd-92bd1bed739a` | `reported -> collection_requested -> not_found_on_collection` |

## 補足

- `seed` は upsert ベースのため、過去履歴の完全消去は行っていない。
- 画面スクリーンショットは API 手動テスト後の同一 DB を使って取得したため、一覧件数と一部表示行には API テストで追加した通報が含まれる。
- Chrome 拡張経由の自動化は `node_repl` の `sandboxCwd must be an absolute file URI` エラーで使用できなかったため、スクリーンショット取得は Playwright に切り替えた。
