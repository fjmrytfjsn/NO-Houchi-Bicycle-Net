# バックエンド仕様（試作品向け）

## 概要

- プロジェクト: NO-Houchi-Bicycle-Net
- 目的: 通報、持ち主による解除、未解除時の回収依頼、回収結果記録をつなぐ REST API バックエンドを提供する
- 推奨スタック: Node.js + TypeScript, Fastify, PostgreSQL, Prisma, JWT, Docker

本仕様は [基本設計仕様書](./basic-design.md) の試作品スコープに合わせたバックエンドの整理である。
ブラックリスト、高度分析、外部連携、回収後の保管・返還管理は今回スコープ外とし、将来構想として扱う。

## 主要要件

- サポーターまたは管理者向けの認証には JWT（Bearer token）を採用する
- 持ち主向け Owner Web の警告確認・解除操作はアカウント不要で扱う
- 通報、解除、回収依頼、回収結果更新の最低限の操作履歴を保存する
- サポーターの移動履歴は保持せず、通報地点など必要最小限の情報のみ保存する

## 最小限 API（試作品）

- 認証
  - `POST /api/auth/login`: 管理者/サポーターのログイン
- 通報
  - `POST /api/reports`: Android アプリから通報を作成
  - `GET /api/reports`: 管理画面向けの通報一覧
  - `GET /api/reports/:id`: 通報詳細
- 持ち主向け解除
  - `GET /api/owner/markers/:code`: QR から警告対象を確認
  - `POST /api/owner/markers/:code/unlock-temp`: 仮解除
  - `POST /api/owner/markers/:code/unlock-final`: 本解除
- 回収運用
  - `POST /api/reports/:id/collection-request`: 未解除案件を回収依頼対象にする
  - `PATCH /api/reports/:id/collection-result`: 回収結果を `collected` または `not_found_on_collection` として記録する

## 主要状態

- `reported`: 通報済み
- `temporary`: 持ち主が仮解除済み
- `resolved`: 本解除済み
- `collection_requested`: 管理者が回収依頼済み
- `collected`: 回収完了
- `not_found_on_collection`: 回収依頼後、現地で自転車が見つからなかった

## データモデル（概略）

- `User`: サポーターまたは管理者
- `Marker`: QR で参照される識別子
- `BicycleReport`: 通報情報、位置、画像、状態
- `MoveDeclaration`: 仮解除・本解除の宣言情報
- `CollectionRequest`: 回収依頼と回収結果の履歴

## 今回スコープ外

- ブラックリスト照合や即時撤去アラート
- ヒートマップ、時空間分析、行政向け高度レポート
- 回収後の保管・返還・処分管理
- ポイント/クーポンの詳細設計や外部店舗連携
- 撮影品質判定、ジオフェンシング、警察連携
- 本番運用レベルの監視基盤やマイクロサービス分割

## 次のステップ

1. `docs/api-spec.md` と実装ルートの差分を確認する
2. 通報、解除、回収依頼、回収結果記録の最小 API を実装する
3. `docs/data-model.md` の論理モデルと Prisma schema の対応を整理する
