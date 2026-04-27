# NO-Houchi Bicycle Net (Project D2)

大阪府北区における放置自転車問題を解決するためのシビックテック・プラットフォームのモノレポです。
現在の基本設計は、ソリューションの価値を伝えるための試作品スコープとして、通報、持ち主による解除、未解除時の回収依頼、回収結果記録までを中心に整理しています。

ブラックリスト、高度分析、回収後の保管・返還管理、詳細なインセンティブ設計、外部連携などは、今回の試作品では必須範囲に含めず、将来構想として扱います。

## 📁 ディレクトリ構成

本リポジトリは以下のプロジェクトで構成されています。

```text
.
├── apps
│   ├── android-app       # 📱 サポーター用モバイルアプリ (Android)
│   ├── owner-web         # 🌐 放置自転車持ち主用ウェブアプリ (Web)
│   └── admin-dashboard   # 📊 管理者用ダッシュボード (Web)
├── backend               # 🚀 バックエンドサーバー (API / DB接続)
└── docs                  # 📚 設計書・仕様書ドキュメント

```

## ✨ システム概要

### 1. サポーター用アプリ (Android)

北区民（サポーター）が使用するネイティブアプリです。

- **試作品の機能:** 放置自転車の撮影、GPS位置情報と識別情報の送信、QR/ポイント要素の簡易提示。
- **将来構想:** OCR精度向上、撮影品質判定、ジオフェンシング、ランキングなどの詳細なインセンティブ設計。
- **Target:** Android

### 2. 持ち主用ウェブアプリ (Web)

放置自転車の持ち主が、マーカーのQRコードを読み取った際にアクセスするWebページです。

- **試作品の機能:** 警告ステータスの確認、仮解除、本解除、仮解除タイマーの表示。
- **将来構想:** クーポン発行・利用管理などの詳細インセンティブ連携。
- **特徴:** インストール不要、スマホブラウザに最適化。

### 3. 管理者用ダッシュボード (Web)

区役所職員が通報状況と回収運用を確認する管理画面です。

- **試作品の機能:** 通報一覧、未解除案件の確認、回収依頼、回収結果（回収完了/現地で現物なし）の記録。
- **将来構想:** ヒートマップ、ブラックリスト管理、サポーター管理、回収後の保管・返還管理。

### 4. サーバー (Backend)

全クライアントからのリクエストを処理するAPIサーバーです。

- **試作品の機能:** 通報登録、通報参照、解除状態管理、回収依頼状態管理、操作履歴記録。
- **将来構想:** ポイント/クーポン詳細ロジック、OCR処理連携、高度な不正検知、外部システム連携。

---

## 🛠 前提条件 (Prerequisites)

開発を開始する前に、以下のツールがインストールされていることを確認してください。

- **Node.js** (v18 or later) & **npm/yarn**
- **Java Development Kit (JDK)** & **Android Studio** (アプリ開発用)
- **Docker** (推奨: データベース等のローカル環境構築用)

---

## 🚀 開発環境のセットアップ (Getting Started)

### 1. リポジトリのクローン

- ssh

  ```bash
  git@github.com:fjmrytfjsn/NO-Houchi-Bicycle-Net.git
  cd NO-Houchi-Bicycle-Net
  ```

- https

  ```bash
  https://github.com/fjmrytfjsn/NO-Houchi-Bicycle-Net.git
  cd NO-Houchi-Bicycle-Net
  ```

### 2. 依存関係のインストール

各ディレクトリで依存関係をインストールしてください。（※Turborepo等を使用している場合はルートで実行）

```bash
# Backend
cd backend
npm install

# Owner Web
cd ../apps/owner-web
npm install

# Admin Dashboard
cd ../apps/admin-dashboard
npm install

```

### ローカル開発方針（CI無し）

- 本プロジェクトでは **CI（自動ワークフロー）は導入しません**。
- 変更はローカルで `npm test` や `npm run lint` を実行して確認してください。
- 詳細な手順と推奨ワークフローは `docs/developer-workflow.md` を参照してください。

### 3. 環境変数の設定 (.env)

各ディレクトリの `.env.example` をコピーして `.env` を作成し、DB接続情報などを設定してください。
Google Maps API や OCR/外部連携用 API キーは将来構想の機能で必要になる場合があります。

---

## 💻 各コンポーネントの実行方法

### 🚀 Server (Backend)

```bash
cd backend
npm run dev
# Server will start on http://localhost:3000 (example)

```

### 📊 Admin Dashboard

```bash
cd apps/admin-dashboard
npm run dev
# Dashboard will open at http://localhost:8080

```

### 🌐 Owner Web App

```bash
cd apps/owner-web
npm run dev
# Web app will open at http://localhost:8081

```

### 📱 Android App (Supporter)

Android Studioで `apps/android-app` ディレクトリを開き、エミュレータまたは実機を選択して実行ボタンを押してください。
またはコマンドラインから:

```bash
cd apps/android-app
./gradlew installDebug

```

---

## 🏗 技術スタック (Tech Stack)

| Component          | Technology                    |
| ------------------ | ----------------------------- |
| **Android App**    | Kotlin / Java (or Flutter)    |
| **Web Apps**       | React / Next.js / Vue.js      |
| **Backend**        | Node.js (Express/NestJS) / Go |
| **Database**       | PostgreSQL / Firestore        |
| **Storage**        | AWS S3 / Firebase Storage     |
| **Infrastructure** | Docker / AWS                  |

---

## 📝 ドキュメント

詳細な仕様書は `docs` ディレクトリを参照してください。

- [基本設計仕様書](./docs/basic-design.md)
- [ビジネスモデル試算メモ](./docs/business-model-estimate.md)
- [クーポン費用試算メモ](./docs/coupon-cost-model.md)
- [API仕様書](./docs/api-spec.md)
- [データモデル定義](./docs/data-model.md)
- [GitHub Project 運用ルール](./docs/project-management.md)

---
