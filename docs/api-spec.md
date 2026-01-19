# API仕様書

## 認証

- 認証方式: JWT ベアラートークン（管理者 / サポーター向け）
- ヘッダ例: `Authorization: Bearer <token>`

## 共通レスポンス形式

```json
{ "status": "ok|error", "data": ..., "error": { "code": "", "message": "" } }
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

### POST /api/auth/login

- 説明: 管理者/サポーターのログイン
- Body: `{ "email": string, "password": string }`
- レスポンス: `{ "token": "<jwt>" }`

---

## 持ち主向けエンドポイント（アカウント不要）

### POST /owner/markers/:code/move

- 説明: 持ち主が移動宣言（仮措置）を行う（アカウント不要）
- Body:
  - `{ "declaredAt": "<timestamp>", "notes"?: string, "ownerToken"?: string }`
- 期待挙動: 所有者の宣言が受理されると該当通報にフラグがつき、状況に応じて管理者に通知される。

## エラーハンドリング

- 400: リクエスト不正 (バリデーションエラー)
- 401: 認証エラー
- 403: 権限エラー
- 404: リソース未検出
- 500: サーバー内部エラー

---

## 仕様追記のガイドライン

- 各エンドポイントは OpenAPI (Swagger) 形式での記述を推奨
- API バージョニングは `/api/v1/...` を検討
