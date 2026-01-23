# セットアップガイド

このドキュメントは、プロジェクトを初めてセットアップする際の手順を説明します。

## 前提条件

以下のツールがインストールされていることを確認してください。

- **Node.js** v18 以上
- **npm** または **yarn**
- **Docker** & **Docker Compose**（Backend データベース用）
- **Git**

## ステップ 1: リポジトリのクローン

```bash
git clone https://github.com/fjmrytfjsn/NO-Houchi-Bicycle-Net.git
cd NO-Houchi-Bicycle-Net
```

## ステップ 2: Backend のセットアップ

### 2.1 依存関係のインストール

```bash
cd backend
npm install
```

### 2.2 環境変数の設定

```bash
cp .env.example .env
```

`.env` ファイルを編集して、必要な環境変数を設定します：

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/bicycle-net"

# JWT
JWT_SECRET="your-secret-key-change-this"

# Server
PORT=3000
NODE_ENV=development
```

### 2.3 PostgreSQL の起動

Docker Compose を使用して PostgreSQL を起動します：

```bash
docker-compose up -d
```

ステータス確認：

```bash
docker-compose ps
```

### 2.4 Prisma の準備

```bash
# Prisma Client の生成
npx prisma generate

# マイグレーション実行
npx prisma migrate dev --name init
```

### 2.5 Backend サーバーの起動

```bash
npm run dev
```

サーバーは `http://localhost:3000` で起動します。

確認：

```bash
curl http://localhost:3000
# { "ok": true, "version": "0.1.0" }
```

### 2.6 Backend テストの実行

```bash
npm test
```

## ステップ 3: Owner Web アプリケーションのセットアップ

### 3.1 ディレクトリ移動と依存関係のインストール

```bash
cd ../apps/owner-web
npm install
```

### 3.2 環境変数の設定（オプション）

```bash
# 必要に応じて .env.local を作成
# 例: API エンドポイント
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 3.3 Owner Web アプリケーションの起動

```bash
npm run dev
```

アプリケーションは `http://localhost:3001` で起動します。

ブラウザで以下にアクセス：

```
http://localhost:3001/markers/ABC123
```

### 3.4 テストの実行

```bash
# ユニットテスト（Jest）
npm test

# E2E テスト（Playwright）
npm run e2e

# ブラウザで確認しながら E2E テスト
npm run e2e:headed
```

## ステップ 4: 動作確認

### Owner Web の基本フロー確認

1. ブラウザで `http://localhost:3001/markers/ABC123` にアクセス
2. 「解除（仮）」ボタンをクリック → メッセージが表示される
3. 仮解除後、15分以上経過シミュレーション（ブラウザのコンソール）
4. 「本解除を実行」ボタンをクリック → 完了メッセージが表示される

## よくある問題と対処法

### PostgreSQL が起動しない

```bash
# Docker ログ確認
docker-compose logs postgres

# 再起動
docker-compose restart postgres
```

### ポート競合

別のプロセスがポート 3000 または 3001 を使用している場合：

```bash
# ポート確認（Windows PowerShell）
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue

# ポート確認（macOS/Linux）
lsof -i :3000
```

### Node.js モジュールエラー

キャッシュをクリアして再インストール：

```bash
rm -rf node_modules package-lock.json
npm install
```

### Prisma マイグレーションエラー

既存のマイグレーションをリセット：

```bash
npx prisma migrate reset
```

## 環境変数リファレンス

### Backend (.env)

| 変数名 | 説明 | 例 |
|---|---|---|
| `DATABASE_URL` | PostgreSQL 接続文字列 | `postgresql://user:password@localhost:5432/bicycle-net` |
| `JWT_SECRET` | JWT トークンの署名キー | `your-secret-key` |
| `PORT` | サーバーポート | `3000` |
| `NODE_ENV` | 実行環境 | `development` / `production` |

### Owner Web (.env.local)

| 変数名 | 説明 | 例 |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:3000` |

## 次のステップ

- [開発者ワークフロー](./developer-workflow.md) を確認
- [API 仕様](./api-spec.md) を確認
- [Owner Web API 仕様](./owner-api.md) を確認
