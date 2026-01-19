# Backend - NO-Houchi Bicycle Net

TypeScript + Fastify + Prisma ベースの API サーバーのスキャフォールドです。

セットアップ:

1. .env を作成（`cp .env.example .env`）
2. Docker Compose で起動: `docker-compose up -d`（Postgres を起動）
3. 依存関係をインストール: `npm install`
4. Prisma 生成/マイグレート: `npm run prisma:generate && npm run prisma:migrate`
5. 開発サーバー起動: `npm run dev`

API:

- GET / -> ヘルスチェック
- POST /auth/register, POST /auth/login
- GET/POST /bikes, GET/PUT/DELETE /bikes/:id
