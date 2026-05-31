# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/ja/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-05-31

### Added

- 正典マッチャー（`src/matcher.ts`）: 正規化・matchType 判定・衝突解決ロジック
- `src/normalize.ts`: NFKC-lower 正規化ユーティリティ
- `src/resolver.ts`: 複数候補からの最終勘定科目解決ロジック
- ルールフィールド拡張: `priority` / `excludePatterns` / `authority_level` / `invoiceRequired` / `transitionalDeductionRate`
- `schemas/tax-category-enum.json`: 消費税区分の enum スキーマ定義
- ゴールデンコーパス 78 件（`tests/corpus/golden/`）
- 衝突テスト（`tests/collision.test.ts`）・ゴールデンコーパステスト（`tests/golden.test.ts`）
- 配布用ビルド（`dist/`）と `matcher` / `normalize` / `resolver` のパッケージ exports

### Changed

- **破壊的変更**: `taxCategory` / `taxDefault` フィールドを文字列から enum に変更
- **破壊的変更**: `patterns` を NFKC-lower 正規化前提の文字列に変更
- テンプレート間の重複パターンを解消
- 損害保険料パターンを具体化（「保険料」汎用マッチを廃止）
- 地代家賃を事業用課税ルールと住宅用（rule-38）に分離
- SemVer ポリシー明文化: パターン追加 = MINOR、意味変更 = MAJOR

### Fixed

- citation 是正: 地代家賃（No.6225）/ 法定福利費（No.6157）/ 研修費（青色申告決算書）/ 未成工事支出金（No.6451）/ 会議費（措置法61の4・No.5265）/ 外注工賃（No.6498）/ SaaS（No.6118）
- 会議費の非課税基準を 5,000 円から 1 万円に修正（法改正対応）
- 件数のハードコードを撤廃し、データ駆動に変更
- テンプレート 29 件のスキーマ・鮮度検証を追加
- 参照整合性チェックを強化（account-master との整合確認）
- 空 citation の補完（0 件 → 全件補完）
- `schema.test` の TypeScript 型エラーを修正
- `node_modules` の symlink 誤追跡を解消

## [0.2.5] - 2026-04-03

### Fixed

- tax-categories.json: 全17件にsourceUrl+citations追加（0/17→17/17）
- Issue #1 クローズ

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
