# 持ち主向け API 仕様（Owner Web）

## 概要

QRコードでアクセスする持ち主向けの簡易Webフロー向けAPI仕様です。
目的は「警告確認 → 仮解除（unlock-temp） → 本解除（unlock-final）」を安全かつ操作しやすく提供することです。

**実装状況**: Owner Web では現在インメモリストアで実装。Backend との統合は次フェーズ予定。

---

## フロー

1. QR を読み取り `/api/owner/markers/:code` にアクセスして対象の通報 (report) を表示。
2. 持ち主が「解除（仮）」を押すと `POST /api/owner/markers/{code}/unlock-temp` を呼ぶ。サーバは `status=temporary` にし、以下を返す:
   - `declaredAt`（時刻）
   - `eligibleFinalAt` = declaredAt + 15分
   - `expiresAt` = declaredAt + 24時間
3. 15分経過後に `POST /api/owner/markers/{code}/unlock-final` を呼ぶと `status=resolved`（本解除）になる。
4. 24時間経過時点で本解除されていない場合、サーバの定期ジョブで自動的に `resolved` にする。

---

## 主要エンドポイント

### GET /api/owner/markers/{code}

- 説明: 指定 `code` の最新 `BicycleReport`（あれば）と現在の `declaration` を返す
- ステータスコード: 200 OK
- レスポンス例:

```json
{
  "marker": { "code": "ABC123" },
  "report": {
    "id": "r-ABC123",
    "status": "reported",
    "imageUrl": "",
    "ocr_text": ""
  },
  "declaration": null
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

- 説明: 本解除（最終解除）を実行（条件: 現在は仮解除かつ server.now >= eligibleFinalAt）
- ステータスコード: 200 OK（成功）、400 Bad Request（条件未満）
- 成功レスポンス例:

```json
{
  "finalizedAt": "2026-01-19T12:20:00.000Z",
  "status": "resolved"
}
```

- エラーレスポンス例:

```json
{
  "error": "no declaration found"
}
```

```json
{
  "error": "eligibleFinalAt has not arrived"
}
```

---

## エラーハンドリング

| ステータスコード | 説明               | 例                                              |
| ---------------- | ------------------ | ----------------------------------------------- |
| 400              | Bad Request        | `code` が無効、declaration がない、時間条件未満 |
| 404              | Not Found          | マーカーが存在しない                            |
| 405              | Method Not Allowed | GET/POST 以外のメソッド                         |

---

## DB モデル案

- テーブル `move_declarations`:
  - `id`, `marker_id`, `report_id`, `declared_at`, `eligible_final_at`, `expires_at`, `status` (temporary|finalized|expired), `finalized_at`, `ip`, `user_agent`, `notes`
- `bicycle_reports.status` は `reported|marked_for_collection|collected|resolved|temporary` をサポート

---

## バッチ処理

- 定期ジョブ（例: 5 分毎）:
  - `expires_at <= now` の temporary 宣言を `finalized` にして `bicycle_reports.status = resolved` に更新

---

## 監査・ログ

- すべての解除操作（仮/本）は `ip`, `user_agent`, `timestamp` を保存
- 異常なパターン (短期間に大量解除) はアラート対象

---

## 受入基準

- `GET /api/owner/markers/{code}` が該当レポートを表示する
- `POST /api/owner/markers/{code}/unlock-temp` で `declaredAt`, `eligibleFinalAt`, `expiresAt` が返る
- `POST /api/owner/markers/{code}/unlock-final` は `eligibleFinalAt` 到達前は拒否、到達後は `resolved` になる
- 24時間経過で自動的に `resolved` になる
