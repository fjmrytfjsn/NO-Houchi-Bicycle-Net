# Issue #32: Backend のバリデーションとエラー処理整備

## Goal

- backend の既存 API に対して、入力検証・状態競合・404・権限エラーを整理する。
- レスポンス形式は既存の `{ error, ...details }` を維持する。

## Non-goals

- `bikes` 系 API への認可追加
- エラーレスポンスの全面フォーマット刷新
- `User.role` の enum 化や Prisma schema 変更

## Files And Docs Inspected

- `backend/src/app.ts`
- `backend/src/lib/errors.ts`
- `backend/src/routes/*.ts`
- `backend/src/services/*.ts`
- `backend/test/*.spec.ts`
- `docs/api/api-spec.md`
- `docs/api/openapi.yaml`
- `docs/api/openapi-owner.yaml`
- `ARCHITECTURE.md`
- `AGENTS.md`

## Planned Changes

- `ForbiddenError` と管理 API 用 auth helper を追加し、`/api/reports*` に JWT + admin ロール制御を入れる。
- `auth` `reports` `owner` `bikes` の入力値を trim 前提で検証し、空文字・形式不正・範囲外を整理する。
- owner / collection 系の「現在状態では実行不可」を `409` に寄せる。
- backend の Vitest を更新し、`401/403/400/404/409` の期待値を固定する。
- API ドキュメントを実装に合わせて更新する。

## Verification

- `cd backend && npm test`
- `cd backend && npm run build`
- `git diff --check`

## Assumptions

- 管理 API の対象は `reports` 系のみ。
- `admin` 以外の role は管理 API にアクセス不可。
- owner の `unlock-final` で marker 不存在は `404`、`scannedCode` 不一致は `400`、時間・状態競合は `409`。

## Risks And Follow-ups

- `docs/api/*` は `/api/auth/login` と実装の prefix 差分が残っているため、今回の更新では error semantics に集中し、prefix の全面整理は別作業に分離する。
- durable な運用方針追加が出た場合は `ARCHITECTURE.md` の追記要否を確認する。
