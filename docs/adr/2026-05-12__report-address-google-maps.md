# ADR: 通報住所スナップショットと Google Maps 利用

## Status

Accepted

## Context

管理画面では通報位置を人間が判断しやすい住所と地図で確認する必要がある。一覧表示のたびにブラウザから逆ジオコーディングすると、表示件数に比例して API 呼び出しが増え、読み込み時間とクォータ消費が大きくなる。

## Decision

- 通報作成時に Backend で Google Geocoding API を呼び、取得できた住所を `BicycleReport.address` に保存する。
- 住所取得に失敗しても通報作成は継続し、`address` は `null` とする。
- Admin Dashboard は保存済み住所を優先表示し、詳細系画面では Google Maps Embed API の iframe と外部リンクを表示する。
- Backend 用キーは `GOOGLE_MAPS_API_KEY`、Frontend の地図表示用キーは `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` として分離する。

## Consequences

- 一覧表示時の逆ジオコーディング呼び出しを避けられる。
- 住所は通報時点のスナップショットであり、既存データや取得失敗データでは座標表示にフォールバックする。
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` はブラウザに公開されるため、Google Cloud 側で HTTP referrer 制限が必要。
