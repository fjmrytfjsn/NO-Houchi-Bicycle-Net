モノレポ（Monorepo）構成での開発、素晴らしいですね。管理がしやすくなります。
これまでの設計内容（NO-Houchi Bicycle Net / D2班）を踏まえた、具体的で分かりやすい `README.md` を作成しました。

プロジェクトのルートディレクトリに配置することを想定しています。

---

# NO-Houchi Bicycle Net (Project D2)

大阪府北区における放置自転車問題を解決するためのシビックテック・プラットフォームのモノレポです。
市民参加型（サポーター）の通報アプリ、持ち主向けの警告確認Web、管理者用のダッシュボード、およびそれらを支えるバックエンドサーバーを含みます。

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

- **機能:** QRマーカーのスキャン、放置自転車の撮影（OCR/画像認識）、GPS位置情報の送信、ポイント管理。
- **Target:** Android

### 2. 持ち主用ウェブアプリ (Web)

放置自転車の持ち主が、マーカーのQRコードを読み取った際にアクセスするWebページです。

- **機能:** 警告ステータスの確認、解除申請（移動宣言）、仮解除タイマーの表示。
- **特徴:** インストール不要、スマホブラウザに最適化。

### 3. 管理者用ダッシュボード (Web)

区役所職員や回収業者が使用する管理画面です。

- **機能:** 放置自転車マップ（ヒートマップ）、ブラックリスト管理、回収指示、サポーター管理。

### 4. サーバー (Backend)

全クライアントからのリクエストを処理するAPIサーバーです。

- **機能:** データベース管理、画像ストレージ連携、ステータス管理、ポイント計算ロジック、OCR処理連携。

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

各ディレクトリの `.env.example` をコピーして `.env` を作成し、必要なAPIキー（Google Maps API, Cloud Vision API, DB接続情報など）を設定してください。

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
- [API仕様書](./docs/api-spec.md)
- [データモデル定義](./docs/data-model.md)

---
