# API仕様書

## 認証

- 認証方式: JWT ベアラートークン（管理者 / サポーター向け）
- ヘッダ例: `Authorization: Bearer <token>`

## 共通レスポンス形式

```json
{ "status": "ok|error", "data": ..., "error": { "code": "", "message": "" } }
```

実装都合により一部エンドポイントでは以下の簡易形式を返す場合がある。

```json
{ "error": "message" }
```

---

## エンドポイント一覧（主要）

### POST /api/reports

- 説明: サポーターが放置自転車通報を作成
- Body (JSON):
  - `imageUrl`: string
  - `latitude`: number
  - `longitude`: number
  - `markerId`?: string
  - `notes`?: string
- レスポンス: 作成した `report` オブジェクト

### POST /api/reports/validate

- 説明: 通報前の品質・ルール検証を行う（次フェーズ）
- Body (JSON):
  - `imageUrl`: string
  - `latitude`: number
  - `longitude`: number
  - `capturedAt`: string (ISO8601)
- 検証内容:
  - 画像品質（ぼけ、暗所、QR欠損）
  - ジオフェンス違反（通報禁止エリア判定）
  - タイムラグ通報条件（短時間駐輪の抑制）
- レスポンス例:

```json
{
  "status": "ok",
  "data": {
    "isValid": false,
    "reasons": ["inside_geofence", "low_image_quality"],
    "suggestion": "明るい場所で再撮影してください"
  }
}
```

### GET /api/reports

- 説明: 通報一覧（管理者向け、フィルタあり）
- Query:
  - `status` (optional), `from`, `to`, `bbox`
- レスポンス: `[{ report }]`

### GET /api/reports/:id

- 説明: 通報詳細

### PATCH /api/reports/:id/status

- 説明: 管理者が通報のステータスを更新（例: `marked_for_collection` | `collected` | `resolved`）
- Body: `{ "status": string, "notes"?: string }`

### GET /api/admin/hotspots

- 説明: 通報データの時空間集計（管理者向けヒートマップ）
- Query:
  - `from` (ISO8601)
  - `to` (ISO8601)
  - `gridSize` (optional)
- レスポンス: 集計済みセルと件数

### GET /api/admin/blacklist

- 説明: 常習犯候補一覧を返す
- Query:
  - `minViolationCount` (optional, default: 3)
- レスポンス: `[{ registrationId, violationCount, escalationLevel, lastSeenAt }]`

### POST /api/admin/blacklist/:registrationId/escalate

- 説明: 常習犯の対応レベルを更新（例: immediate_removal）
- Body: `{ "escalationLevel": "warning|priority|immediate_removal" }`

### POST /api/auth/login

- 説明: 管理者/サポーターのログイン
- Body: `{ "email": string, "password": string }`
- レスポンス: `{ "token": "<jwt>" }`

---

## 持ち主向けエンドポイント（アカウント不要）

### GET /owner/markers/:code/coupons

- 説明: 指定マーカーに紐づくクーポン発行履歴を返す

### POST /owner/markers/:code/unlock-temp

- 説明: 持ち主が仮解除を実行
- Body: `{ "notes"?: string }`

### POST /owner/markers/:code/unlock-final

- 説明: 持ち主が本解除を実行（`eligibleFinalAt` 到達後）
- Body: `{ "ownerEmail"?: string }`
- 備考: 本解除時にクーポン発行処理が走る

### POST /owner/coupons/:id/use

- 説明: 発行済みクーポンを利用済みに更新

### POST /owner/markers/:code/move (legacy)

- 説明: 持ち主が移動宣言（仮措置）を行う（アカウント不要）
- Body:
  - `{ "declaredAt": "<timestamp>", "notes"?: string, "ownerToken"?: string }`
- 期待挙動: 所有者の宣言が受理されると該当通報にフラグがつき、状況に応じて管理者に通知される。

## 外部連携インターフェース（ロードマップ）

### POST /integrations/police/stolen-check

- 説明: 防犯登録番号の照会（実運用時は権限管理された連携先を想定）
- Body: `{ "registrationId": "string" }`
- レスポンス例:

```json
{
  "status": "ok",
  "data": {
    "isStolen": true,
    "caseRef": "KITA-2026-0001"
  }
}
```

### POST /integrations/shops/coupons/issue

- 説明: 商店街クーポン基盤への発行通知（将来連携）
- Body: `{ "markerCode": "string", "ownerEmail"?: "string" }`

## エラーハンドリング

- 400: リクエスト不正 (バリデーションエラー)
- 401: 認証エラー
- 403: 権限エラー
- 404: リソース未検出
- 409: 状態競合（例: 既に本解除済み）
- 422: 業務ルール違反（ジオフェンス、品質基準未達）
- 500: サーバー内部エラー

---

## 仕様追記のガイドライン

- 各エンドポイントは OpenAPI (Swagger) 形式での記述を推奨
- API バージョニングは `/api/v1/...` を検討
