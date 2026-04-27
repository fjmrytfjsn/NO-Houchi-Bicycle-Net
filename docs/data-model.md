# データモデル定義

## 概要

主要なエンティティのフィールド、型、制約を示します。以下は主要モデルの例です。

## 設計方針

- 本ドキュメントは [基本設計仕様書](./basic-design.md) の試作品スコープに合わせ、「試作品で扱う主要モデル」と「将来拡張モデル」を併記する。
- 実装済みモデルの厳密な定義（型・必須・relation・正式命名）は `backend/prisma/schema.prisma` を正とする。
- 本ドキュメントのフィールド名は説明の可読性を優先した論理モデル表記（snake_case 含む）であり、Prisma 実装名（camelCase）とは一致しない場合がある。
- ブラックリスト、高度分析、外部連携、詳細なインセンティブ機能は今回スコープ外であり、段階導入を前提とする。

---

## User

- `id` (UUID, PK)
- `email` (string, unique)
- `password_hash` (string)
- `role` (enum: supporter | admin)
- `created_at`, `updated_at`

## Marker

- `id` (UUID, PK)
- `code` (string, QR に埋め込む ID)
- `location` (geometry/point)
- `created_at`, `updated_at`

## BicycleReport

- `id` (UUID, PK)
- `marker_id` (FK -> Marker)
- `image_url` (string)
- `latitude`, `longitude` (decimal)
- `identifier_text` (text)
- `status` (enum: reported | temporary | resolved | collection_requested | collected | not_found_on_collection)
- `notes` (text, nullable)
- `created_at`, `updated_at`

## Declaration（移動宣言）

- `id` (UUID, PK)
- `marker_id` (FK -> Marker)
- `declared_at` (timestamp)
- `eligible_final_at` (timestamp)
- `expires_at` (timestamp)
- `finalized_at` (timestamp, nullable)
- `status` (enum: temporary | resolved | expired)
- `notes` (text, nullable)
- `created_at`, `updated_at`

## CollectionRequest（回収依頼・回収結果）

- `id` (UUID, PK)
- `report_id` (FK -> BicycleReport)
- `requested_by` (string, nullable; 試作品では認証連携なしで行政側の操作主体を任意保存)
- `requested_at` (timestamp)
- `result` (enum: pending | collected | not_found_on_collection)
- `result_recorded_by` (string, nullable; 試作品では認証連携なしで任意保存)
- `result_recorded_at` (timestamp, nullable)
- `notes` (text, nullable)
- `created_at`, `updated_at`

---

## 将来拡張モデル

以下は今回の試作品では必須ではないが、完成形に向けた拡張候補として残す。

## Coupon（将来構想）

- `id` (UUID, PK)
- `name` (string)
- `description` (text)
- `shop_name` (string)
- `discount` (int)
- `discount_type` (enum: amount | percentage)
- `valid_days` (int)
- `is_active` (bool)
- `created_at`, `updated_at`

## CouponIssuance（将来構想）

- `id` (UUID, PK)
- `coupon_id` (FK -> Coupon)
- `user_id` (FK -> User, nullable)
- `marker_id` (FK -> Marker, nullable)
- `owner_email` (string, nullable)
- `issued_at` (timestamp)
- `expires_at` (timestamp)
- `used_at` (timestamp, nullable)
- `status` (enum: active | used | expired)
- `created_at`, `updated_at`

## Blacklist（常習犯管理・将来構想）

- `id` (UUID, PK)
- `registration_id` (string, unique)
- `violation_count` (int)
- `last_seen_image_hash` (string)
- `last_seen_at` (timestamp)
- `escalation_level` (enum: warning | priority | immediate_removal)
- `created_at`, `updated_at`

## GeofenceZone（通報制限エリア・将来構想）

- `id` (UUID, PK)
- `name` (string)
- `zone_type` (enum: parking_lot | private_area | restricted)
- `polygon_coordinates` (geometry/polygon)
- `is_active` (bool)
- `created_at`, `updated_at`

## AuditLog（監査・不正検知ログ・将来構想）

- `id` (UUID, PK)
- `user_id` (FK -> User, nullable)
- `device_id` (string)
- `ip_address` (string)
- `action_type` (string)
- `risk_score` (decimal)
- `metadata` (jsonb)
- `created_at`

## CleanupRecord（回収後管理・将来構想）

- `id` (UUID, PK)
- `report_id` (FK -> BicycleReport)
- `contractor_id` (string)
- `disposal_location` (string)
- `cost_saved_estimate` (decimal)
- `completed_at` (timestamp)
- `created_at`, `updated_at`

試作品では、回収依頼と回収結果は `CollectionRequest` で扱う。
保管場所、返還手続き、処分記録、費用削減推定などの詳細管理は今回スコープ外とする。

---

## インデックス/パフォーマンス

- 位置検索用に `ST_Geography` または `PostGIS` を利用し、ジオインデックスを作成
- `status`, `created_at` に対する複合インデックス
- 将来拡張時に `Blacklist.registration_id` のユニークインデックスを検討
- 将来拡張時に `AuditLog.device_id`, `AuditLog.created_at` の複合インデックスを検討
- 将来拡張時に `GeofenceZone.polygon_coordinates` の空間インデックスを検討
- 将来拡張時に `CleanupRecord.completed_at` の時系列インデックスを検討

## 匿名化・データ保持方針

- サポーターの連続移動履歴（線データ）は保持しない。
- 行政向けの可視化データは匿名化し、個人特定可能情報を除去する。
- `AuditLog` は不正検知目的で保存し、保持期間を定義して定期削除する。

---

更新履歴:

- v0.1 初版
- v0.2 中間発表Q&A反映（Declaration/Coupon系の明記、Blacklist/GeofenceZone/AuditLog/CleanupRecord追加）
- v0.3: QR再スキャン仕様対応
- v0.4: 試作品スコープに合わせて CollectionRequest と状態定義を整理
