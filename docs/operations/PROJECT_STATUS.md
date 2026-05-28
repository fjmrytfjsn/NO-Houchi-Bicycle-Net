# プロジェクト状態レポート

**更新日**: 2026年5月28日

**参照Project**: [NO-Houchi Bicycle Net MVP](https://github.com/users/fjmrytfjsn/projects/3)

## 方針

現在の基本設計は、完成形の全機能ではなく「価値を伝えるための試作品」へスコープを整理している。
試作品では、通報、持ち主による解除、未解除時の回収依頼、回収結果記録までを中心に扱う。
ブラックリスト、高度分析、回収後の保管・返還管理、詳細なインセンティブ設計、外部連携は将来構想とする。

## 全体進捗

| コンポーネント | 状態 | 進捗度 | 備考 |
| --- | --- | --- | --- |
| Backend Server | 🔄 実装中 | 35% | Fastify、Prisma、JWT 認証、通報/回収依頼/回収結果 API 実装済み。ローカル検証と seed データ運用あり |
| Owner Web | 🔄 修正完了 | 25% | API 実装済み。インメモリ要素を残しつつローカル検証手順を整備 |
| Admin Dashboard | 🔄 実装中 | 35% | 通報一覧/詳細、未解除案件、回収依頼登録、回収結果記録、ログイン導線を確認。2026-05-28 に再確認を実施 |
| Android App | ⏳ 未開始 | 0% | 試作品では撮影・位置情報付き通報を優先 |

## 直近の確認事項

- 2026-05-28 に Admin Dashboard の主要フロー再確認を実施した。
- ログイン、通報一覧、状態フィルター、通報詳細、未解除案件、回収対象フラグ変更、回収依頼、回収結果記録の主要経路は再確認できた。
- 再確認結果は [manual-verification-2026-05-28.md](../testing/manual-verification-2026-05-28.md) に記録した。
- 恒久的な手順は [admin-dashboard-manual.md](./admin-dashboard-manual.md) に整理した。

## 現在の注意点

- `backend/package.json` の `npm run prisma:migrate` は `prisma migrate dev --name init` を呼ぶため、非対話環境では失敗する。自動化や headless 実行では `npx prisma migrate deploy` などの別手順が必要。
- `npm run prisma:seed` は upsert ベースで、既存の回収依頼履歴や結果履歴を削除しない。再確認を繰り返すと履歴が累積するため、完全に初期状態から確認したい場合は DB を作り直す必要がある。
- 管理画面の動作確認はローカル前提で、CI は導入していない。

## 今後のアクション

1. Admin Dashboard の手動確認を繰り返しやすいよう、DB 初期化手順または検証専用 DB の運用を整理する。
2. `prisma:migrate` スクリプトの非対話実行互換性を見直す。
3. Owner Web と Backend の結合確認、および Admin Dashboard を含む横断 E2E の整備を進める。
4. 試作品スコープ外の機能は拡張せず、現行フローの検証容易性と文書整合を優先する。

## 関連リンク

- [開発者ワークフロー](./developer-workflow.md)
- [セットアップガイド](./SETUP.md)
- [管理者ダッシュボード運用マニュアル](./admin-dashboard-manual.md)
- [Admin Dashboard 手動確認レポート 2026-05-28](../testing/manual-verification-2026-05-28.md)
- [Backend API 仕様](../api/api-spec.md)
