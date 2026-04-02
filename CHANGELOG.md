# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/ja/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.4] - 2026-04-03

### Added

- 業種別テンプレート6種追加: 農業(3)/運輸・物流(2)/卸売(2)/金融・保険(2)/教育(2)/美容・サービス(2)
- 業種別テンプレート合計: 7→13業種、16→29ルール

## [0.2.3] - 2026-04-02

### Added

- 業種別テンプレート3種追加: 建設業(3ルール)・製造業(2ルール)・小売業(2ルール)
- 業種別テンプレート合計: 4→7業種、9→16ルール

## [0.2.2] - 2026-04-02

### Added

- 業種別テンプレート4種（rules/templates/）: 飲食業・医療業・不動産業・IT/SaaS
- 福利厚生費サブルール2件: 健康診断（課税）・慶弔見舞金（不課税）
- 前払費用ルール（資産科目・短期前払費用特例注記付き）
- ルール数 33→36 に拡大
- 全テンプレートにcitations必須（v0.2.0スキーマ準拠）

## [0.2.0] - 2026-04-02

### Added

- `citations` フィールドを全33ルール・31科目に追加（構造化エビデンス管理）
- テストで citations の存在・整合性を自動検証（4テスト追加）
- `scripts/generate-sources.ts` — docs/sources.md をJSONから自動生成
- `npm run generate-docs` コマンド追加

### Changed

- docs/sources.md を手動管理から自動生成に移行（DRY原則）

## [0.1.2] - 2026-04-02

### Fixed

- journal-rules.json: 残り2ルール（売掛金回収・クレカ引落）のsourceUrl充足（31/33→33/33）
- amount-thresholds.json: 残り2閾値（固定資産・高額取引）のsourceUrl充足（5/7→7/7）
- sourceUrl設定率: journal-rules 100%、account-master 100%、amount-thresholds 100%

## [0.1.1] - 2026-04-02

### Added

- 5パターン追加（28→33パターン）: 車両費/リース料/賞与/修繕費/利子割引料
- 勘定科目マスタに3科目追加（車両費/リース料/賞与）
- 修繕費の金額閾値ルール追加（No.5402: 20万円/60万円基準）
- 根拠URL 5件追加（No.2210/5704/6163/2523/5402）

## [0.1.0] - 2026-04-02

### Added

- 初期仕訳ルール28パターン（経費・売上・資産・負債）
- 勘定科目マスタ（freee互換JSON形式）
- 消費税区分マスタ（標準10%/軽減8%/非課税/不課税/免税）
- 摘要パターンマッチングルール
- 金額による勘定科目自動分岐（10万円/30万円境界）
- バリデーションロジック（TypeScript）
- テストスイート（Vitest）
- CONTRIBUTING.md（ルール追加ガイドライン）
- CODE_OF_CONDUCT.md（行動規範）
- LICENSE（CC BY 4.0）+ LICENSE-CODE（MIT）
- GitHub Actions CI
- Issue/PRテンプレート
- SECURITY.md（セキュリティポリシー）
