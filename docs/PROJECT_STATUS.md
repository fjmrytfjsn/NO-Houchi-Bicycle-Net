# プロジェクト状態レポート

**更新日**: 2026年4月13日  
**現在のブランチ**: `codex/mvp-basic-design-doc`

## 方針

現在の基本設計は、完成形の全機能ではなく「価値を伝えるための試作品」へスコープを整理している。
試作品では、通報、持ち主による解除、未解除時の回収依頼、回収結果記録までを中心に扱う。
ブラックリスト、高度分析、回収後の保管・返還管理、詳細なインセンティブ設計、外部連携は将来構想とする。

## 📊 全体進捗

| コンポーネント  | 状態        | 進捗度 | 備考                               |
| --------------- | ----------- | ------ | ---------------------------------- |
| Backend Server  | ✅ 実装中   | 30%    | Fastify, Prisma, JWT 認証基盤完成  |
| Owner Web       | 🔄 修正完了 | 25%    | API 実装済み、インメモリストア動作 |
| Admin Dashboard | ⏳ 未開始   | 0%     | 試作品では通報一覧・回収依頼・回収結果記録を優先 |
| Android App     | ⏳ 未開始   | 0%     | 試作品では撮影・位置情報付き通報を優先 |

## ✅ 完了した作業

### Backend

- [x] Fastify サーバーセットアップ
- [x] JWT 認証実装
- [x] Prisma ORM 統合
- [x] PostgreSQL マイグレーション
- [x] バイク管理 API エンドポイント
- [x] ユーザー認証ルート（register/login）
- [x] ユニットテスト（Vitest）

### Owner Web

- [x] Next.js プロジェクトセットアップ
- [x] マーカー詳細ページコンポーネント
- [x] 仮解除・本解除API エンドポイント
- [x] Jest テスト設定修正
- [x] Playwright E2E テスト設定
- [x] Backend 設計パターンへの適合化
- [x] TypeScript 型安全性向上
- [x] API レスポンス形式統一

### ドキュメント

- [x] 基本設計仕様書
- [x] API 仕様書
- [x] データモデル定義
- [x] 開発者ワークフロー（更新）
- [x] Owner Web API 仕様（更新）
- [x] セットアップガイド（新規作成）
- [x] 基本設計仕様書を試作品スコープへ再整理

## 🔄 進行中の作業

- Owner Web と Backend の実際の統合（現在: インメモリストア使用）
- 試作品スコープに合わせた API / データモデル / 管理画面仕様の具体化

## 📋 今後のアクション（優先度順）

### 高優先度（次フェーズ）

1. **Backend と Owner Web の API 統合**
   - Owner Web が Backend API を呼び出すよう修正
   - 環境変数で API エンドポイント設定
   - データベース永続化

2. **E2E テストの充実**
   - marker.spec.ts の実装
   - より詳細なテストケース追加
   - CI 環境での自動実行検討

3. **認証機能の実装**
   - Owner Web への JWT 認証追加（必要な場合）
   - Backend との連携確認

4. **Admin Dashboard の実装**
   - 通報一覧の表示
   - 未解除案件の確認
   - 回収依頼登録
   - 回収結果（回収完了/現地で現物なし）の記録
   - Backend API 連携

### 中優先度

5. **バリデーション強化**
   - リクエストパラメータのバリデーション
   - エラーハンドリングの改善
   - ユーザーへのエラーメッセージ提供

6. **パフォーマンス最適化**
   - キャッシング戦略
   - Database インデックス最適化
   - API レスポンス時間測定

7. **セキュリティ強化**
   - CSRF 対策
   - レート制限
   - 入力サニタイズ

### 低優先度

8. **CI/CD パイプライン設定**
   - GitHub Actions ワークフロー
   - 自動テスト実行
   - デプロイメント自動化

9. **インフラストラクチャセットアップ**
   - Docker イメージ作成
   - AWS/GCP へのデプロイ準備
   - 本番環境構築

10. **Android アプリケーション実装**
    - Kotlin/Flutter でのサポーター用アプリ開発
    - 撮影機能
    - GPS 位置情報機能
    - 識別情報の入力/送信

### 将来構想

- ブラックリスト管理
- ヒートマップや高度分析
- 回収後の保管・返還管理
- ポイント/クーポンの詳細インセンティブ設計
- 不正検知の高度化
- 撮影品質判定、ジオフェンシング、警察・店舗連携

## 🧪 テスト状況

### Backend

- **Vitest**: 実装済み（2件のテスト）
- **ステータス**: ✅ 成功

### Owner Web

- **Jest**: ✅ 実装済み（テスト成功）
- **Playwright**: ✅ 設定完了（テスト設定準備完了）
- **ステータス**: ✅ 両方成功

## 📁 ファイル構造

```
NO-Houchi-Bicycle-Net/
├── backend/                    # Fastify サーバー
│   ├── src/
│   │   ├── routes/            # API エンドポイント
│   │   ├── plugins/           # Prisma プラグイン
│   │   └── app.ts             # アプリケーション設定
│   ├── prisma/
│   │   ├── schema.prisma      # データベーススキーマ
│   │   └── migrations/        # DB マイグレーション
│   ├── test/                  # テストファイル
│   └── package.json
├── apps/
│   ├── owner-web/             # Next.js アプリケーション
│   │   ├── pages/
│   │   ├── lib/               # API クライアント
│   │   ├── components/        # React コンポーネント
│   │   ├── __tests__/         # Jest テスト
│   │   ├── tests/e2e/         # Playwright E2E テスト
│   │   └── package.json
│   └── admin-dashboard/       # (未実装)
└── docs/
    ├── basic-design.md
    ├── api-spec.md
    ├── owner-api.md           # (更新)
    ├── developer-workflow.md   # (更新)
    ├── SETUP.md               # (新規)
    └── PROJECT_STATUS.md      # このファイル
```

## 🔗 関連リンク

- [開発者ワークフロー](./developer-workflow.md)
- [セットアップガイド](./SETUP.md)
- [Owner Web API 仕様](./owner-api.md)
- [Backend API 仕様](./api-spec.md)
- [データモデル定義](./data-model.md)

## 📝 メモ

- CI は導入しない方針（ローカル検証を優先）
- インメモリストア現在使用中 → Backend への統合が次のマイルストーン
- テスト環境は整備完了（Jest, Vitest, Playwright）
