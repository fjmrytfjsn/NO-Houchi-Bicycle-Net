# Backend - NO-Houchi Bicycle Net

TypeScript + Fastify + Prisma ベースの API サーバーのスキャフォールドです。

セットアップ:

1. .env を作成（`cp .env.example .env`）
2. Docker Compose で起動: `docker-compose up -d`（Postgres を起動）
3. 依存関係をインストール: `npm install`
4. Prisma 生成/マイグレート: `npm run prisma:generate && npm run prisma:migrate`
5. 開発サーバー起動: `npm run dev`

API:

- GET / -> ヘルスチェック
- POST /auth/register, POST /auth/login
- GET/POST /bikes, GET/PUT/DELETE /bikes/:id
- **POST /bikes/ocr/recognize** -> OCR（防犯登録番号認識）
- **POST /owner/markers/:code/unlock-temp** -> 仮解除
- **POST /owner/markers/:code/unlock-final** -> 本解除（クーポン発行）
- **GET /owner/markers/:code/coupons** -> クーポン一覧取得
- **POST /owner/coupons/:id/use** -> クーポン使用

## クーポンシステム

持ち主が本解除を行うと、商店街で使えるクーポンが自動的に発行されます。

### 機能

- **自動クーポン発行**: 本解除完了時に500円分のお買い物券または割引クーポンを自動発行
- **クーポン一覧**: マーカーコードから発行されたクーポンを確認可能
- **クーポン使用**: 店舗でクーポンを使用済みに変更
- **有効期限管理**: クーポンごとに有効期限を設定（デフォルト30日間）

### API使用例

```bash
# 1. 仮解除（15分間の猶予期間開始）
curl -X POST http://localhost:3000/owner/markers/ABC123/unlock-temp \
  -H "Content-Type: application/json" \
  -d '{"notes": "自転車を移動しました"}'

# 2. 本解除（15分後、クーポン発行）
curl -X POST http://localhost:3000/owner/markers/ABC123/unlock-final \
  -H "Content-Type: application/json" \
  -d '{"ownerEmail": "owner@example.com"}'

# レスポンス例
{
  "finalizedAt": "2026-01-25T12:15:00.000Z",
  "status": "resolved",
  "coupon": {
    "id": "coupon-id-123",
    "name": "商店街お買い物券500円",
    "description": "商店街の加盟店で使える500円分のお買い物券",
    "shopName": "北区商店街",
    "discount": 500,
    "discountType": "amount",
    "expiresAt": "2026-02-24T12:15:00.000Z"
  },
  "message": "クーポンを獲得しました！商店街でご利用ください。"
}

# 3. クーポン一覧取得
curl http://localhost:3000/owner/markers/ABC123/coupons

# 4. クーポン使用
curl -X POST http://localhost:3000/owner/coupons/coupon-id-123/use
```

### データモデル

- **Coupon**: クーポンマスター（商店街の店舗が提供するクーポン情報）
- **CouponIssuance**: クーポン発行履歴（持ち主に発行されたクーポン）
- **Declaration**: 仮解除・本解除の宣言情報

## OCR機能

Azure Form Recognizer を使用して画像から防犯登録番号を自動認識します。

### セットアップ

1. Azure Form Recognizer リソースを作成（Azure Portal）
2. エンドポイントとAPIキーを取得
3. `.env` に以下を追加：

```env
AZURE_FORM_RECOGNIZER_ENDPOINT=https://xxxxx.cognitiveservices.azure.com/
AZURE_FORM_RECOGNIZER_KEY=your-api-key-here
```

### API使用例

```bash
# FTPから取得した画像ファイルをOCR処理
curl -X POST http://localhost:3000/bikes/ocr/recognize \
  -H "Content-Type: application/json" \
  -d '{"filePath": "/path/to/bicycle/image.jpg"}'

# レスポンス例
{
  "success": true,
  "result": {
    "registrationNumber": "12345678",
    "confidence": 0.95,
    "rawText": "自転車の防犯登録番号は 12345678 です"
  }
}
```

### 仕様

- **入力**: ローカルファイルパス（FTPから事前取得したJPG/PNG画像）
- **出力**: 防犯登録番号（8~10桁）、信頼度スコア（0.0-1.0）、生テキスト
- **対応フォーマット**: JPEG, PNG, BMP, TIFF
- **精度**: Azure Form Recognizer依存（一般的に95%以上）

開発ワークフローと方針:

- CI は導入しません。ローカル検証を重視し、`docs/developer-workflow.md` に手順をまとめています。
- ローカルでのテスト実行: `npm test`（Vitest）
- 推奨: Docker Compose で Postgres を立ち上げ、`npx prisma generate` / `npx prisma migrate dev` を実行してから `npm run dev` でアプリを起動してください。
