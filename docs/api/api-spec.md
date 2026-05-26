# API仕様書

本書は [基本設計仕様書](../design/basic-design.md) の試作品スコープに合わせ、通報、持ち主による解除、未解除時の回収依頼、回収結果記録を中心に整理する。
高度分析、ブラックリスト、外部連携、クーポン詳細機能は今回スコープ外の将来構想として扱う。

## 認証

- 認証方式: JWT ベアラートークン（管理者 / サポーター向け）
- ヘッダ例: `Authorization: Bearer <token>`

## 共通レスポンス形式

```json
{ "status": "ok|error", "data": ..., "error": { "code": "", "message": "" } }
```

現状は移行期間のため、以下の2形式が混在する。

- `/api/*`（管理者/サポーター向け）は原則ラッパー形式
- `/owner/*`（持ち主向け）と legacy エンドポイントは簡易形式を許容
- 将来的には API バージョニング（`/api/v1`）で形式統一を行う

簡易形式:

```json
{ "error": "message" }
```

---

## エンドポイント一覧（主要）

### POST /api/reports

- 説明: サポーターが放置自転車通報を作成
- 認証: JWT 必須、`admin` ロールのみ
- Body (JSON):
  - `imageUrl`: string
  - `latitude`: number
  - `longitude`: number
  - `markerCode`: string
  - `identifierText`: string
  - `notes`?: string
- レスポンス: 作成した `report` オブジェクト
- 実装方針:
  - `imageUrl`、`markerCode`、`identifierText` は空文字不可
  - `latitude` / `longitude` は finite number かつ緯度経度の範囲内であること
  - 該当マーカーが存在しない場合は backend 側で新規作成して紐づける
  - 初期 `status` は `reported`
  - `GOOGLE_MAPS_API_KEY` が設定されている場合は、`latitude` / `longitude` から Google Geocoding API で住所を取得し、`address` に保存する
  - 住所取得に失敗した場合も通報作成は継続し、`address` は `null` とする

### POST /api/reports/validate（将来構想）

- 説明: 通報前の品質・ルール検証を行う
- 今回スコープ: 試作品では必須 API に含めない
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
- 認証: JWT 必須、`admin` ロールのみ
- Query:
  - `status` (optional, `reported|temporary|resolved|collection_requested|collected|not_found_on_collection`)
- レスポンス: `[{ report }]`
- 備考: `report.address` が存在する場合、管理画面は住所を優先表示する。未設定時は座標表示にフォールバックする。
- レスポンスには回収依頼候補の判定用として `isCollectionCandidate`, `collectionCandidateDecision`, `collectionCandidateFlaggedAt` を含む。
- Admin Dashboard の未解除案件確認画面では、この API を `status=reported` で呼び、`reported全件` と `回収対象のみ` を切り替える。
- backend は read 時に遅延反映を行い、`reported` かつ通報受付から24時間を超え、かつ手動上書きされていない案件を `isCollectionCandidate = true` として自動候補化する。

### GET /api/reports/:id

- 説明: 通報詳細
- 認証: JWT 必須、`admin` ロールのみ
- レスポンス: `report`。位置情報として `latitude`, `longitude`, `address` を含み、`history[]` を返す。
- `history[]`:
  - `id`: 履歴エントリ ID
  - `timestamp`: 履歴発生時刻（ISO8601）
  - `label`: 表示用ラベル
  - `notes` (optional): 補足メモ
- 備考:
  - 先頭に `通報を受付` を含む。
  - `Declaration` 由来で `持ち主が仮解除` / `持ち主が本解除` を best effort で組み立てる。
  - `CollectionRequest` 由来で `回収依頼を登録` / `回収結果を記録` を組み立てる。
  - 返却順は時系列昇順。

### PATCH /api/reports/:id/collection-candidate

- 説明: 管理者が `reported` の通報を回収依頼候補として手動で ON/OFF する
- 認証: JWT 必須、`admin` ロールのみ
- Body: `{ "isCollectionCandidate": boolean, "updatedBy"?: string, "notes"?: string }`
- 期待挙動:
  - `true`: `isCollectionCandidate = true`, `collectionCandidateDecision = manual_on`
  - `false`: `isCollectionCandidate = false`, `collectionCandidateDecision = manual_off`
  - `collectionCandidateFlaggedAt` は ON 時に更新し、OFF 時は `null`
  - 対象が `reported` 以外の場合は `409`

### PATCH /api/reports/:id/status

- 説明: 管理者が通報のステータスを更新（例: `collection_requested` | `collected` | `not_found_on_collection` | `resolved`）
- Body: `{ "status": string, "notes"?: string }`

### POST /api/reports/:id/collection-request

- 説明: 一定時間内に持ち主による解除が行われなかった通報を、管理者が回収依頼対象にする
- 認証: JWT 必須、`admin` ロールのみ
- Body: `{ "notes"?: string, "requestedBy"?: string }`
- 期待挙動:
  - report.status を `collection_requested` に更新する
  - 回収依頼候補フラグ（`isCollectionCandidate` など）はクリアする
  - 回収依頼の操作履歴を保存する
  - 対象が `reported` 以外の場合は `409`

### PATCH /api/reports/:id/collection-result

- 説明: 回収業者の現地結果を受けて、管理者が回収結果を記録する
- 認証: JWT 必須、`admin` ロールのみ
- Body: `{ "result": "collected|not_found_on_collection", "notes"?: string, "resultRecordedBy"?: string }`
- 期待挙動:
  - `collected`: 回収完了として案件を閉じる
  - `not_found_on_collection`: 現地で現物なしとして未回収記録を残す
  - 対象が `collection_requested` 以外、または pending 履歴がない場合は `409`

### GET /api/admin/hotspots（将来構想）

- 説明: 通報データの時空間集計（管理者向けヒートマップ）
- 今回スコープ: 試作品では必須 API に含めない
- Query:
  - `from` (ISO8601)
  - `to` (ISO8601)
  - `gridSize` (optional)
- レスポンス: 集計済みセルと件数

### GET /api/admin/blacklist（将来構想）

- 説明: 常習犯候補一覧を返す
- 今回スコープ: 試作品では必須 API に含めない
- Query:
  - `minViolationCount` (optional, default: 3)
- レスポンス: `[{ registrationId, violationCount, escalationLevel, lastSeenAt }]`

### POST /api/admin/blacklist/:registrationId/escalate（将来構想）

- 説明: 常習犯の対応レベルを更新（例: immediate_removal）
- 今回スコープ: 試作品では必須 API に含めない
- Body: `{ "escalationLevel": "warning|priority|immediate_removal" }`

### POST /api/auth/login

- 説明: 管理者/サポーターのログイン
- Body: `{ "email": string, "password": string }`
- バリデーション: `email` と `password` は空文字不可、`email` は最低限の email 形式必須
- レスポンス: `{ "status": "ok", "data": { "token": "<jwt>" }, "error": null }`

---

## 持ち主向けエンドポイント（アカウント不要）

- 公開パスは `/api/owner/*`（Owner Web から呼び出す経路）
- バックエンド内部ルータでは `/owner/*` として実装される場合がある

### GET /api/owner/markers/:code

- 説明: QR からアクセスした持ち主に、対象マーカーの警告内容、通報状態、仮解除情報を返す
- 挙動: `marker.code` と、該当 marker に紐づく最新 `BicycleReport`・最新 `Declaration` を返す。`report` と `declaration` は存在しない場合 `null`
- エラー: marker が存在しない場合は `404` で `{ "error": "Marker not found" }`

### GET /api/owner/markers/:code/coupons（実装済み・将来拡張）

- 説明: 指定マーカーに紐づくクーポン発行履歴を返す
- 今回スコープ: 実装は存在するが、詳細な発行・利用管理は必須 API に含めない

### POST /api/owner/markers/:code/unlock-temp

- 説明: 持ち主が仮解除を実行
- Body: `{ "notes"?: string }`
- バリデーション: `code` は空文字不可

### POST /api/owner/markers/:code/unlock-final

- 説明: 持ち主が本解除を実行（`eligibleFinalAt` 到達後）
- Body: `{ "scannedCode": string, "ownerEmail"?: string }`
- バリデーション:
  - `code` と `scannedCode` は空文字不可
  - `ownerEmail` を送る場合は最低限の email 形式必須
- 備考:
  - `scannedCode` は必須。QR再スキャン照合で `:code` と一致した場合のみ本解除される
  - marker が存在しない場合は `404`
  - 仮解除なし、`eligibleFinalAt` 未到達、24時間期限切れは `409`
  - クーポン発行処理は backend に実装されているが、試作品の必須要件には含めない

### POST /api/owner/coupons/:id/use（実装済み・将来拡張）

- 説明: 発行済みクーポンを利用済みに更新
- 今回スコープ: 試作品では必須 API に含めない

### POST /api/owner/markers/:code/move (legacy)

- 説明: 持ち主が移動宣言（仮措置）を行う（アカウント不要）
- Body:
  - `{ "declaredAt": "<timestamp>", "notes"?: string, "ownerToken"?: string }`
- 期待挙動: 所有者の宣言が受理されると該当通報にフラグがつき、状況に応じて管理者に通知される。

## 外部連携インターフェース（ロードマップ）

以下はソリューションの完成形に向けた将来構想であり、今回の試作品スコープには含めない。

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
- 403: 権限エラー（例: 非 `admin` が `/api/reports*` にアクセス）
- 404: リソース未検出
- 409: 状態競合（例: 本解除の前提未達、回収依頼/結果記録の対象 status 不一致）
- 422: 業務ルール違反（ジオフェンス、品質基準未達）
- 500: サーバー内部エラー

---

## 仕様追記のガイドライン

- 各エンドポイントは OpenAPI (Swagger) 形式での記述を推奨
- API バージョニングは `/api/v1/...` を検討
