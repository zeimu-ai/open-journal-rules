# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/ja/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
