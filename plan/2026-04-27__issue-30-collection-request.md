# Issue 30 回収依頼API

## Goal

- `POST /api/reports/:id/collection-request` を実装し、`reported` の通報を `collection_requested` に更新する。
- 回収依頼履歴を `CollectionRequest` として保存する。

## Non-goals

- 管理者JWT認証やUser FK連携は今回含めない。
- 回収結果記録APIは別タスクで扱う。

## Changes

- `CollectionRequest` Prismaモデルとmigrationを追加する。
- 回収依頼APIは `notes` と任意の `requestedBy` を受け取り、履歴へ保存する。
- 回収依頼対象は `reported` のみとし、それ以外のstatusは400で拒否する。
- `docs/api-spec.md`、`docs/openapi.yaml`、`docs/data-model.md` を実装に合わせて更新する。

## Verification

- `TMPDIR=/tmp npm test -- reports.spec.ts`
- `TMPDIR=/tmp npm test`
- `npm run build`
- `DATABASE_URL=postgresql://user:password@localhost:5432/no_houchi npm exec -- prisma validate`
- `DATABASE_URL=postgresql://user:password@localhost:5432/no_houchi npm run prisma:generate`

## Docs Maintenance

- `AGENTS.md`: コマンドや運用ルール変更なしのため更新不要。
- `ARCHITECTURE.md`: 既に回収依頼を主要フローとして記載済みのため更新不要。
- `docs/adr/`: 認証なしの `requestedBy` は試作品向けのIssue限定実装であり、長期アーキテクチャ判断ではないため追加不要。
