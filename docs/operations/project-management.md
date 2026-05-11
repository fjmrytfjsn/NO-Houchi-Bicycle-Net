# GitHub Project 運用ルール

この文書は、GitHub Projects と Issue を使った NO-Houchi Bicycle Net のタスク管理ルールを定義する。

## 利用するProject

- Project: [NO-Houchi Bicycle Net MVP](https://github.com/users/fjmrytfjsn/projects/3)
- Project のアイテムは原則として GitHub Issue にする。
- PR は対象 Issue に紐づけ、完了条件を満たしたら Issue と Project Status を同期する。

## Project の主なフィールド

| フィールド | 用途 |
| --- | --- |
| `Status` | 作業状態。`Todo`, `In Progress`, `Review`, `Done` を使う。 |
| `Primary` | 大工程。例: `設計`, `Backend 開発`, `Owner Web 開発`。 |
| `Secondary` | 中分類。例: `API 設計`, `通報 API`, `E2E テスト`。 |
| `Tertiary` | 小分類。具体的な作業領域を示す。 |
| `Start date` | 着手予定日または着手日。 |
| `End date` | 完了予定日または完了目安。 |
| `WBS No` | WBS上の並び順。 |
| `Task` | Issueタイトルと同じ、または短い作業名。 |

## Status の定義

| Status | 定義 |
| --- | --- |
| `Todo` | 未着手、または完了根拠がまだ揃っていない状態。 |
| `In Progress` | 担当者が着手中。作業ブランチ、plan、PRのいずれかで進行が確認できる状態。 |
| `Review` | 実装または文書更新が終わり、レビュー、確認、手元検証待ちの状態。 |
| `Done` | 完了または中止が確定し、Issue が Close されている終端状態。 |

## Issue 作成ルール

- 1 Issue は、完了判定できる1つの成果物または作業単位にする。
- `mvp` ラベルを基本ラベルとして付ける。
- 領域別ラベルを1つ以上付ける。例: `design`, `backend`, `owner-web`, `admin-dashboard`, `android`, `test`, `docs`。
- 対応する Milestone を設定する。
- Project に追加し、`Primary`, `Secondary`, `Tertiary`, `Start date`, `End date`, `WBS No`, `Task` を設定する。
- 実装Issueでは、完了条件にテスト、型チェック、lint、差分確認のどれが必要かをIssue本文またはPR本文で明記する。

## 着手時のルール

- 担当者を設定する。
- Project Status を `In Progress` にする。
- 広い変更、複数セッション作業、API/データモデル変更では `plan/YYYY-MM-DD__task-slug.md` を作る。
- 既存仕様や実装とIssue内容がずれている場合は、先にIssueコメントで差分を残す。

## PR 作成時のルール

- PR本文に対象Issueを `Closes #N` または `Refs #N` で明記する。
- CIは導入しない方針のため、PR本文にローカル検証結果を記載する。
- PR作成後、対象IssueのProject Statusを原則 `Review` にする。
- ドキュメント、API、データモデル、運用ルールに変更がある場合は、関連ドキュメントも同じPRで更新する。

## 完了同期ルール

Issue を完了扱いにする時は、以下を同じタイミングで行う。

1. 完了根拠をIssueコメントに残す。
2. Issueを `completed` 理由で Close する。
3. Project Status を `Done` にする。
4. PRがある場合はIssueとPRのリンクが残っていることを確認する。
5. 実装や仕様の現状が `docs/operations/PROJECT_STATUS.md` とずれる場合は、同ファイルも更新する。

完了根拠は、実装ファイル、仕様書、テスト、PR、またはレビュー結果のいずれかを具体的に示す。
単に「作業した」だけではなく、どのファイルやPRで完了を判断したかを残す。

## 完了にしないケース

- 実装Issueなのに設計書だけが存在する。
- API仕様はあるが実装ルートが存在しない。
- テストIssueなのにテストが未追加、または実行不能なまま理由が整理されていない。
- Owner Web のモック実装だけで、IssueがBackend連携を求めている。
- Admin Dashboard や Android のように、ディレクトリや実体がまだ存在しない。

この場合は `Todo` のまま残し、必要ならIssueコメントで未完了理由を明記する。

## 中止・スコープ外の扱い

- 作業を行わないことが決まったIssueは、Issueコメントに理由を残して Close する。
- `completed` ではなく、GitHubの `not planned` 相当の理由を使う。
- Project Status は `Done` にし、IssueのClose理由で「完了」と「中止」を区別する。
- 中止理由がスコープ判断に関わる場合は、別途スコープ整理のIssueやドキュメントに反映する。

## 定期同期

- 少なくとも広い変更やPR作成前後に、ProjectとIssueの不整合を確認する。
- 確認する不整合:
  - IssueがClosedなのにProject Statusが `Done` ではない。
  - Project Statusが `Done` なのにIssueがOpenのまま。
  - 完了済み作業が `Todo` に残っている。
  - `docs/operations/PROJECT_STATUS.md` の進捗とGitHub Projectが大きくずれている。
- 不整合を直した場合は、同期したIssue番号と判断根拠を記録する。

## 2026-04-20 同期メモ

2026-04-20 に現状同期を実施し、完了根拠が確認できたIssueをCloseし、Project Statusを `Done` に更新した。

- 同期後のProject件数: `Done` 21件、`Todo` 35件。
- Issue状態とProject Statusの不整合: 0件。
- `In Progress` と `Review` はまだ運用されていない。
- 未完了として残した主な領域: Admin Dashboard、Android、通報API、回収API、Backend連携、結合/E2Eテスト、仕上げ文書。
