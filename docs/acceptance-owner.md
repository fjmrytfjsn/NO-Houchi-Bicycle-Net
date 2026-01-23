# 受入（E2E）テストシナリオ — Owner Web

これらは Playwright / Cypress などで自動化することを想定した受入テストシナリオです。

## シナリオ 1: 仮解除の作成

- 前提: マーカー `ABC123` に `reported` な `BicycleReport` がある
- 手順:
  1. GET /owner/markers/ABC123 を呼ぶ → report が返る
  2. POST /owner/markers/ABC123/unlock-temp を呼ぶ
- 期待:
  - レスポンスに `declaredAt`, `eligibleFinalAt` (= now+15m), `expiresAt` (= now+24h) がある
  - report の status が `仮解除` になる
  - 操作ログが保存される（ip, user_agent, timestamp）

## シナリオ 2: 本解除の早期拒否

- 前提: シナリオ1 実行後、まだ `eligibleFinalAt` に達していない
- 手順: POST /owner/markers/ABC123/unlock-final を呼ぶ
- 期待: 4xx (400) が返る（メッセージに `too_early`）

## シナリオ 3: 本解除（正常）

- 前提: `eligibleFinalAt` 到達後
- 手順: POST /owner/markers/ABC123/unlock-final を呼ぶ
- 期待:
  - report.status == `resolved`
  - `finalizedAt` が設定される
  - 操作ログに最終解除が記録される

## シナリオ 4: 24時間経過による自動解除

- 前提: `expiresAt` に達する
- 手順: バッチジョブ（5分毎）を実行
- 期待: report.status == `resolved`（自動で移行）、`finalizedAt` にタイムスタンプが入る

## シナリオ 5: 重複/並列の仮解除

- 前提: 複数回 unlock-temp が押された場合
- 期待: 最新の宣言が有効、履歴はすべて残る

## シナリオ 6: 監視/不正検知

- システムは短時間に多数の解除を行うIPにアラートを出すか、レート制限で拒否する

---

### 自動化のヒント

- Playwright の場合、サーバ時刻判定が絡むため、テスト環境で時刻をシミュレート（DB の timestamps を書き換え or サーバの clock を制御）することを検討
- E2E は本番同等の DB ステートを用意し、テスト後はロールバック/クリーンアップする
