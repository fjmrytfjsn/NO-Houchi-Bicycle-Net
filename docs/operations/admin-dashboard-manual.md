# 管理者ダッシュボード運用マニュアル

## 目的

管理者ダッシュボードで、放置自転車の通報確認、回収対象判断、回収依頼、回収結果記録を行うための恒久的な手順をまとめる。

このマニュアルでは、現行実装に対応する既存スクリーンショットとして `docs/testing/screenshots/2026-05-27/` 配下の画像を併記する。

## 前提環境

- 管理画面 URL: `http://localhost:3002`
- Backend API URL: `http://localhost:3000`
- PostgreSQL: `localhost:5432/no_houchi_dev`
- Node.js: `v22.15.0` で確認
- `TMPDIR=/tmp` を付けると Jest/Vitest/Next.js の一時ファイル起因の失敗を避けやすい
- 地図埋め込みは `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` 未設定でも主要操作は可能

## 事前準備

### Backend

```bash
cd backend
npm install
docker-compose up -d postgres
TMPDIR=/tmp DATABASE_URL=postgresql://postgres:postgres@localhost:5432/no_houchi_dev JWT_SECRET=change-me npm run prisma:generate
```

- 対話シェルでマイグレーションを適用する場合は `npm run prisma:migrate` を使う。
- 非対話環境では `npm run prisma:migrate` は失敗するため、必要に応じて `npx prisma migrate deploy` を使う。
- seed データを投入する場合は以下を実行する。

```bash
TMPDIR=/tmp DATABASE_URL=postgresql://postgres:postgres@localhost:5432/no_houchi_dev JWT_SECRET=change-me npm run prisma:seed
```

### Admin Dashboard

```bash
cd apps/admin-dashboard
npm install
TMPDIR=/tmp ADMIN_API_BASE_URL=http://localhost:3000 npm run dev
```

## seed ログイン情報

- メールアドレス: `admin@example.test`
- パスワード: `password123`

## 画面別の操作手順

### 1. ログイン

1. `http://localhost:3002/login` を開く。
2. seed 管理者アカウントを入力して `ログイン` を押す。

確認ポイント:
- 未ログインで `/` にアクセスすると `/login?next=%2F` へリダイレクトされる。
- ログイン成功後は `通報一覧` へ遷移する。

![](../testing/screenshots/2026-05-27/admin-01-login.png)

### 2. 通報一覧

1. `通報一覧` で全件数、未解除件数、回収依頼中件数を確認する。
2. 状態フィルターで `reported`、`resolved`、`collection_requested` などを切り替える。
3. 必要に応じて `詳細を見る` または `回収依頼候補へ` を開く。

確認ポイント:
- 写真、通報日時、位置、識別情報、状態が表示される。
- `Google Mapsで開く` から外部地図リンクを開ける。

![](../testing/screenshots/2026-05-27/admin-02-list-all.png)

### 3. 状態フィルター

1. 通報一覧上部の状態フィルターから確認したいステータスを選ぶ。
2. `resolved` などの表示結果を確認する。

確認ポイント:
- URL のクエリに `?status=...` が付く。
- 選択した状態だけが一覧に表示される。

![](../testing/screenshots/2026-05-27/admin-03-list-resolved.png)

### 4. 通報詳細

1. 一覧から `詳細を見る` を押す。
2. 写真、位置、座標、識別情報、現在ステータス、履歴を確認する。
3. `reported` または `temporary` の案件では `回収依頼候補として確認` 導線を使う。
4. `collection_requested` の案件では `回収結果記録へ` 導線を使う。

確認ポイント:
- 履歴には通報受付、持ち主操作、回収依頼、回収結果が時系列で表示される。
- 更新直後に表示が古い場合は再読み込みして最新状態を確認する。

![](../testing/screenshots/2026-05-27/admin-04-report-detail-reported.png)

### 5. 回収依頼候補

1. `http://localhost:3002/unresolved?view=all` を開く。
2. `reported全件` と `回収対象のみ` を切り替える。
3. `回収対象にする` / `回収対象から外す` でフラグを更新する。
4. 対象案件から `回収依頼へ進む` を開く。

確認ポイント:
- 自動候補、手動候補、手動除外の区別が表示される。
- `回収対象のみ` ではフラグ ON の案件だけが残る。

![](../testing/screenshots/2026-05-27/admin-05-unresolved-all.png)

![](../testing/screenshots/2026-05-27/admin-06-unresolved-candidate.png)

### 6. 回収依頼

1. `reported` 案件から `回収依頼へ進む` を開く。
2. `依頼メモ` を入力する。
3. `回収依頼登録` を押す。

確認ポイント:
- 対象概要を確認したうえで依頼登録できる。
- 登録後はステータスが `collection_requested` になる。
- 既に回収依頼や結果履歴が残っている seed 案件では、履歴が追記される。

![](../testing/screenshots/2026-05-27/admin-07-collection-request-initial.png)

![](../testing/screenshots/2026-05-27/admin-08-collection-request-submitted-detail.png)

### 7. 回収結果記録

1. `collection_requested` 案件で `回収結果記録へ` を開く。
2. `回収完了` または `現地で現物なし` を選ぶ。
3. `結果メモ` を入力する。
4. `結果を記録` を押す。

確認ポイント:
- 正常系ではステータスが `collected` または `not_found_on_collection` に更新される。
- 対象案件に pending の回収依頼がない場合は `report is not eligible for collection result` などのエラーになる。
- 結果記録直後は詳細画面を再読み込みし、最新状態と履歴を確認する。

![](../testing/screenshots/2026-05-27/admin-09-collection-result-not-found-initial.png)

![](../testing/screenshots/2026-05-27/admin-10-collection-result-not-found-submitted.png)

![](../testing/screenshots/2026-05-27/admin-11-collection-result-collected-initial.png)

![](../testing/screenshots/2026-05-27/admin-12-collection-result-collected-submitted.png)

## 推奨確認コマンド

```bash
cd backend
TMPDIR=/tmp DATABASE_URL=postgresql://postgres:postgres@localhost:5432/no_houchi_dev JWT_SECRET=change-me npm test -- --run
TMPDIR=/tmp DATABASE_URL=postgresql://postgres:postgres@localhost:5432/no_houchi_dev JWT_SECRET=change-me npm run build

cd ../apps/admin-dashboard
TMPDIR=/tmp npm test -- --runInBand
TMPDIR=/tmp npm run type-check
TMPDIR=/tmp npm run lint
TMPDIR=/tmp npm run build
```

## 既知の制約

- `npm run prisma:seed` は upsert ベースで、既存の回収依頼履歴や結果履歴を消さない。手動確認を繰り返すと履歴が累積する。
- 完全に初期状態から確認したい場合は、検証用 DB を作り直すか、別のクリーンな DB を使う。
- このリポジトリには CI がないため、管理画面の確認はローカル実行前提で行う。
- 新しいスクリーンショットが必要な場合は、ブラウザ操作可能な環境で別途取得する。

## 関連ドキュメント

- [セットアップガイド](./SETUP.md)
- [開発者ワークフロー](./developer-workflow.md)
- [Admin Dashboard 手動確認レポート 2026-05-28](../testing/manual-verification-2026-05-28.md)
- [Admin Dashboard ワイヤーフレーム](../ui/wireframes-admin-dashboard.md)
