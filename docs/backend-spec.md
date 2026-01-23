# バックエンド仕様（草案）

## 概要

- プロジェクト: NO-Houchi-Bicycle-Net
- 目的: 自転車管理・運用を行うためのREST APIバックエンドを提供する
- 推奨スタック: Node.js + TypeScript, Fastify, PostgreSQL, Prisma, JWT, Docker

## 主要要件

- 認証: JWT（Bearer token）を採用
- 永続化: PostgreSQL
- ORM: Prisma
- ローカル開発はDocker ComposeでPostgresを起動

## 最小限API（MVP）

- 認証
  - POST /auth/register (ユーザー登録)
  - POST /auth/login (ログイン、JWT発行)
- ユーザー
  - GET /users/{id}
  - PUT /users/{id}
- 自転車
  - GET /bikes
  - POST /bikes
  - GET /bikes/{id}
  - PUT /bikes/{id}
  - DELETE /bikes/{id}
- 賃借（任意）
  - POST /rentals
  - GET /rentals?userId=...

## データモデル（概略）

- User: id, name, email, passwordHash, role, createdAt, updatedAt
- Bike: id, serialNumber, status (available/checked_out/maintenance), location, createdAt, updatedAt
- Rental: id, userId, bikeId, startAt, endAt, status

## ディレクトリ構成案

- src/
  - controllers/
  - services/
  - repositories/
  - db/
  - schemas/
  - plugins/
  - index.ts

## 開発ワークフロー

- Lint: ESLint + Prettier
- テスト: Jest/Vitest
- CI: GitHub Actions（Lint・テスト・ビルド）
- マイグレーション: Prisma Migrate

## 次のステップ

1. OpenAPI仕様を固める（`docs/openapi.yaml`）
2. プロジェクトスキャフォールディング（TypeScript初期化、Fastifyセットアップ、Prisma導入）
3. CRUDと認証の実装

---

※これは草案です。追加要件や変更があれば教えてください。
