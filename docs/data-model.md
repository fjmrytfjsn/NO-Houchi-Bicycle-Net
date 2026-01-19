# データモデル定義

## 概要

主要なエンティティのフィールド、型、制約を示します。以下は主要モデルの例です。

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
- `reporter_id` (FK -> User)
- `image_url` (string)
- `latitude`, `longitude` (decimal)
- `ocr_text` (text)
- `status` (enum: reported | marked_for_collection | collected | resolved)
- `created_at`, `updated_at`

---

## インデックス/パフォーマンス

- 位置検索用に `ST_Geography` または `PostGIS` を利用し、ジオインデックスを作成
- `status`, `created_at` に対する複合インデックス

---

更新履歴:

- v0.1 初版
