# Backend Refactor Plan

## Goal and non-goals

- Goal: route に直書きされた検証・DB操作・レスポンス整形を service 層へ寄せ、型とテストを揃える。
- Goal: `unlock-final` の `scannedCode` 検証を実装し、owner flow と OCR の期待挙動をテストで固定する。
- Non-goal: Prisma schema 変更、API の大幅な再設計、将来構想機能の削除。

## Files and docs inspected

- `backend/src/app.ts`
- `backend/src/routes/*.ts`
- `backend/src/services/*.ts`
- `backend/test/*.spec.ts`
- `backend/prisma/schema.prisma`
- `backend/README.md`
- `docs/api/owner-api.md`
- `docs/api/api-spec.md`
- `docs/api/openapi.yaml`
- `docs/api/openapi-owner.yaml`

## Planned changes

- 共通エラー変換を追加して route の責務を薄くする。
- `auth` `bikes` `owner` の service を分割し、route は request/response と status code に集中させる。
- OCR は Azure 呼び出しと抽出ロジックを分離し、純粋関数テストを追加する。
- Prisma モックを共通化し、auth/bikes/owner の route テストで使い回す。
- docs は `unlock-final` の body と coupon API の扱いだけ現実に合わせる。

## Verification commands

- `cd backend && npm test`
- `cd backend && npm run build`
- `git diff --stat`
- `git status --short`

## Data/API assumptions

- coupon API は削除せず残すが、試作品の必須受入基準には含めない。
- `POST /owner/markers/:code/unlock-final` は `scannedCode` 必須、`ownerEmail` 任意。
- OCR は 8-10 桁を基本とし、大阪府シール形式は末尾 6 桁抽出を特例として残す。

## Risks and follow-ups

- 実行環境に Node.js / npm が無い場合、ローカル検証は未実施になる。
- `docs/design/backend-spec.md` には将来構想寄りの概念モデルが残るため、次回 API 実装拡張時に再整理が必要。

## Project docs updates

- `AGENTS.md`: 更新不要
- `ARCHITECTURE.md`: 更新不要
- `docs/adr/`: 今回の変更では不要
