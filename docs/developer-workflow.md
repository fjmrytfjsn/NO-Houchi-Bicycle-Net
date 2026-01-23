# 開発者ワークフロー（ローカル検証とCI方針）

このドキュメントはローカルでの開発・テスト手順と、プロジェクト方針（CIは導入しない）をまとめたものです。

## 方針

- CI（GitHub Actions 等）は導入しません。理由: 小規模チームでローカル検証を優先し、CI運用コストを避けるため。
- 代替として、**ローカルでの自動化（pre-commit）や明確な手順書**により、品質を担保します。

## ローカル必須手順（開発者向け）

### Backend サーバーの起動

```bash
cd backend
npm install
cp .env.example .env
# 必要に応じて .env の環境変数を編集（DB接続、JWT_SECRET など）

# Docker で Postgres を起動（推奨）
docker-compose up -d

# Prisma の準備
npx prisma generate
npx prisma migrate dev --name init

# サーバ起動（開発）
npm run dev
# http://localhost:3000 で起動
```

### Owner Web アプリの起動

```bash
cd apps/owner-web
npm install
npm run dev
# http://localhost:3001 で起動
```

### テスト実行

```bash
# Backend（Vitest）
cd backend
npm test

# Owner Web（Jest）
cd apps/owner-web
npm test

# Owner Web E2E（Playwright）
cd apps/owner-web
npm run e2e
npm run e2e:headed  # ブラウザで確認したい場合
```

## 推奨的なローカル自動化（任意）

- `husky` と `lint-staged` を導入し、`pre-commit` で `npm test` と `npm run lint` を実行するのを推奨します（プロジェクトに合わせて導入可）。
- または、`npm run check` のようなスクリプトを用意して、手動実行で品質チェックを行ってください。

## テストについて

### Backend
- **Vitest** を使用した単体/統合テスト
- Prisma をモックしたテストと、必要に応じて Postgres を使った統合テスト

### Owner Web
- **Jest** を使用した単体テスト（React コンポーネント）
- **Playwright** を使用した E2E テスト
- TypeScript の型安全性確保

## API 設計の統一

Owner Web は Backend API 設計パターンに合わせて実装されています：

- **シンプルなレスポンス形式**: `{ data }` または `{ error }`
- **適切な HTTP ステータスコード**: 200, 201, 400, 404, 405, etc.
- **パラメータ検証**: リクエスト受け取り時の validation
- **型安全性**: TypeScript interfaces による明示的な型定義

## PR／レビューの運用（CI無し時のガイドライン）

1. **ローカルテスト確認**
   - PR を作成する前にローカルで `npm test` を実行し、すべてのテストが通ることを確認してください。
   - E2E テストも実行して動作確認を行ってください。

2. **コード品質**
   - Lint はローカルで実行し、コミット前に整えます。
   - 型チェック: `npm run type-check`

3. **重要な変更の共有**
   - DB マイグレーション等の重要な変更は事前にチームに共有して下さい。
   - API 仕様変更の場合は、関連ドキュメントも同時に更新してください。

---

必要ならこの方針に沿って `husky` の導入や、`npm run check` スクリプト追加も行います。
