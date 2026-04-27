# 持ち主向け API 仕様（Owner Web）

## 概要

QRコードでアクセスする持ち主向けの簡易Webフロー向けAPI仕様です。
目的は「警告確認 → 仮解除（unlock-temp） → 本解除（unlock-final）」を安全かつ操作しやすく提供することです。
本仕様は [基本設計仕様書](../design/basic-design.md) の試作品スコープに合わせ、持ち主による解除フローを中心に扱います。

**実装状況**: Owner Web では現在インメモリストアで実装。Backend との統合は次フェーズ予定。

**試作品スコープとの関係**:

- 持ち主に対して「マーカー非破壊・行政委託」であることをUI上で明示
- 本解除後のクーポン発行/利用管理は今回スコープ外の将来構想として扱う
- 常習犯対策/盗難照合との連携は今回スコープ外の将来構想として扱う

---

## フロー

1. QR を読み取り `/api/owner/markers/:code` にアクセスして対象の通報 (report) を表示。
2. 持ち主が「解除（仮）」を押すと `POST /api/owner/markers/{code}/unlock-temp` を呼ぶ。サーバは `status=temporary` にし、以下を返す:
   - `declaredAt`（時刻）
   - `eligibleFinalAt` = declaredAt + 15分
   - `expiresAt` = declaredAt + 24時間
3. 15分経過後に、同じマーカーのQRコードを再度スキャンすると本解除が実行される（jsQRによるカメラスキャン）。
   - クライアントは `scannedCode` を `POST /api/owner/markers/{code}/unlock-final` に送信し、サーバーで `:code` と照合する。
4. 24時間経過時点で本解除されていない場合、サーバの定期ジョブで自動的に `resolved` にする。

**本解除のQR再スキャン仕様**:
- 持ち主は本解除ボタンを押すと、カメラが起動しQRコードスキャンモードになる
- スキャンしたQRデータと現在表示中のマーカーコードが一致した場合のみ本解除が実行される
- 異なるQRを読み込んだ場合はエラーが表示される
- キャンセルボタンでスキャンを中止できる

---

## 主要エンドポイント

### GET /api/owner/markers/{code}

- 説明: 指定 `code` の `Marker` に紐づく最新 `BicycleReport`（あれば）と最新 `declaration`（あれば）を返す
- ステータスコード: 200 OK, 404 Not Found
- レスポンス例:

```json
{
  "marker": { "code": "ABC123" },
  "report": {
    "id": "r-1",
    "markerId": "m-1",
    "imageUrl": "https://example.com/report.jpg",
    "latitude": 34.701,
    "longitude": 135.502,
    "identifierText": "OSAKA-123456",
    "status": "reported",
    "notes": null,
    "createdAt": "2026-01-19T11:40:00.000Z",
    "updatedAt": "2026-01-19T11:40:00.000Z"
  },
  "declaration": {
    "id": "d-1",
    "markerId": "m-1",
    "declaredAt": "2026-01-19T12:00:00.000Z",
    "eligibleFinalAt": "2026-01-19T12:15:00.000Z",
    "expiresAt": "2026-01-20T12:00:00.000Z",
    "finalizedAt": null,
    "status": "temporary",
    "notes": null,
    "createdAt": "2026-01-19T12:00:00.000Z",
    "updatedAt": "2026-01-19T12:00:00.000Z"
  }
}
```

- `report` と `declaration` は存在しない場合に `null` を返す
- 未知の `code` の場合は以下を返す

```json
{
  "error": "Marker not found"
}
```

### POST /api/owner/markers/{code}/unlock-temp

- 説明: 仮解除を登録（持ち主による解除操作）
- Body: `{ "notes"?: string }`
- ステータスコード: 200 OK
- レスポンス例:

```json
{
  "declaredAt": "2026-01-19T12:00:00.000Z",
  "eligibleFinalAt": "2026-01-19T12:15:00.000Z",
  "expiresAt": "2026-01-20T12:00:00.000Z",
  "status": "temporary"
}
```

### POST /api/owner/markers/{code}/unlock-final

- 説明: 本解除（最終解除）を実行（条件: 現在は仮解除かつ server.now >= eligibleFinalAt かつ `scannedCode === code`）
- Body: `{ "scannedCode": string, "ownerEmail"?: string }`
- ステータスコード: 200 OK（成功）、400 Bad Request（条件未満）
- 成功レスポンス例:

```json
{
  "finalizedAt": "2026-01-19T12:20:00.000Z",
  "status": "resolved",
  "message": "本解除が完了しました"
}
```

- 実装上はクーポンが有効な場合に `coupon` オブジェクトを含めて返す。
- クーポン発行/利用 API 自体は backend に存在するが、試作品の必須受入基準には含めない。

- エラーレスポンス例:

```json
{
  "error": "No temporary declaration found"
}
```

```json
{
  "error": "eligibleFinalAt has not arrived"
}
```

### GET /api/owner/markers/{code}/coupons（実装済み・将来拡張）

- 説明: 指定マーカーに紐づく発行済みクーポンを取得
- 今回スコープ: backend には実装済みだが、試作品では必須 API に含めない
- ステータスコード: 200 OK
- レスポンス例:

```json
{
  "markerId": "marker-id",
  "code": "ABC123",
  "coupons": [
    {
      "id": "issuance-id",
      "name": "商店街お買い物券500円",
      "discount": 500,
      "discountType": "amount",
      "expiresAt": "2026-02-24T12:15:00.000Z",
      "status": "active"
    }
  ]
}
```

### POST /api/owner/coupons/{id}/use（実装済み・将来拡張）

- 説明: クーポンを利用済みに更新
- 今回スコープ: backend には実装済みだが、試作品では必須 API に含めない
- ステータスコード: 200 OK（成功）、400 Bad Request（使用不可）

---

## エラーハンドリング

| ステータスコード | 説明               | 例                                              |
| ---------------- | ------------------ | ----------------------------------------------- |
| 400              | Bad Request        | `code` が無効、declaration がない、時間条件未満 |
| 404              | Not Found          | マーカーが存在しない                            |
| 405              | Method Not Allowed | GET/POST 以外のメソッド                         |

---

## DB モデル案

- 本節は **将来の統合時に向けた概念モデル案（未実装・命名未確定）**。
- 実装済みモデル/命名は `backend/prisma/schema.prisma` を正とする。

- テーブル `move_declarations`:
  - `id`, `marker_id`, `report_id`, `declared_at`, `eligible_final_at`, `expires_at`, `status` (temporary|finalized|expired), `finalized_at`, `ip`, `user_agent`, `notes`
- `bicycle_reports.status` は `reported|temporary|resolved|collection_requested|collected|not_found_on_collection` をサポート
- テーブル `coupon_issuances`:
  - backend 実装済み。`id`, `coupon_id`, `marker_id`, `owner_email`, `issued_at`, `expires_at`, `used_at`, `status`
- テーブル `audit_logs`:
  - `id`, `action_type`, `marker_code`, `ip`, `user_agent`, `risk_score`, `created_at`

---

## バッチ処理

- 定期ジョブ（例: 5 分毎）:
  - `expires_at <= now` の temporary 宣言を `finalized` にして `bicycle_reports.status = resolved` に更新

---

## 監査・ログ

- すべての解除操作（仮/本）は `ip`, `user_agent`, `timestamp` を保存
- 異常なパターン (短期間に大量解除) の高度なアラートは将来構想
- 本解除時のクーポン発行/利用イベントは backend に試作実装あり。運用設計は将来構想
- 将来的な盗難照合（警察連携）のための防犯登録番号照会イベントは将来構想

---

## 受入基準

- `GET /api/owner/markers/{code}` が該当レポート（画像・識別テキスト含む）と最新 declaration を返す
- `POST /api/owner/markers/{code}/unlock-temp` で `declaredAt`, `eligibleFinalAt`, `expiresAt` が返る
- 仮解除後、同一マーカーQRコードをカメラで再スキャンすることで本解除が実行される
- `unlock-final` は `eligibleFinalAt` 到達前は拒否、到達後は `resolved` になる
- 24時間経過で自動的に `resolved` になる
- クーポン確認・利用 API は将来構想として扱い、今回の受入基準には含めない

## UI表示要件（持ち主画面）

- マーカーは粘着剤不使用の非破壊方式であることを明示する。
- 行政の委託業務の一環であることを明示する。
- 緊急時に取り外しやすい仕様であることを明示する。
