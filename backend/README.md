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
