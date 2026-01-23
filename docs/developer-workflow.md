# 開発者ワークフロー（ローカル検証とCI方針）

このドキュメントはローカルでの開発・テスト手順と、プロジェクト方針（CIは導入しない）をまとめたものです。

## 方針

- CI（GitHub Actions 等）は導入しません。理由: 小規模チームでローカル検証を優先し、CI運用コストを避けるため。
- 代替として、**ローカルでの自動化（pre-commit）や明確な手順書**により、品質を担保します。

## ローカル必須手順（開発者向け）

1. リポジトリをクローン
   - git clone ...
2. backend の依存をインストール
   - cd backend
   - npm install
3. .env を作成
   - cp .env.example .env
   - 必要に応じて環境変数を編集（DB接続、JWT_SECRET など）
4. Docker で Postgres を起動（推奨）
   - docker-compose up -d
5. Prisma の準備
   - npx prisma generate
   - npx prisma migrate dev --name init
6. サーバ起動（開発）
   - npm run dev
7. テスト実行（Vitest）
   - npm test

## 推奨的なローカル自動化（任意）

- `husky` と `lint-staged` を導入し、`pre-commit` で `npm test` と `npm run lint` を実行するのを推奨します（プロジェクトに合わせて導入可）。
- または、`npm run check` のようなスクリプトを用意して、手動実行で品質チェックを行ってください。

## テストについて

- 単体/統合テストは Vitest を使用します。
- 速いフィードバックのため、Prisma はモックしたテストを中心に行い、必要に応じて Postgres を使った統合テストを追加します。

## PR／レビューの運用（CI無し時のガイドライン）

- PR を作成する前にローカルで `npm test` を実行し、すべてのテストが通ることを確認してください。
- コードフォーマット・Lint はローカルで実行し、コミット前に整えます。
- 重要な変更（DB マイグレーション等）は事前にチームに共有して下さい。

---

必要ならこの方針に沿って `husky` の導入や、`npm run check` スクリプト追加も行います。
