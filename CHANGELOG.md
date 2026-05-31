# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/ja/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.6.0] - 2026-05-31

Phase 1（高リスク・即効）の消費税区分・収益側カバレッジ拡充。すべての citation は国税庁ページを WebFetch し、独立エージェントによる再取得照合（verified のみ採用）と実装者による最終確認を経ている。

### Added

- **#15 軽減税率8%**: 飲食料品仕入（`rule-39`）・定期購読新聞（`rule-40`）を追加（`課税仕入8%（軽減税率）`、No.6102）
- **#16 非課税網羅**: 土地賃貸借（`rule-41`、No.6201）・行政手数料/公的証明（`rule-42`、No.6201）・学校授業料（`rule-43`、No.6233）
- **#17 不課税網羅**: 補助金/助成金・損害賠償金・保険金/共済金・寄附金（`rule-44`、No.6157）・受取配当金（`rule-45`、No.6157）
- **#19 売上側**: 売上値引・返品・割戻=対価返還（`rule-46`、No.6359）・受取利息（`rule-47`、No.6201）
- 新規収益科目: `雑収入`・`受取配当金`（不課税）・`受取利息`（非課税）を account-master に追加
- `tests/phase1-coverage.test.ts`: 新規ルール/科目・税区分・土地/建物の誤爆防止の回帰テスト

### Changed

- **#18 交際費（法人）**: `rule-26`/`rule-37` の notes に措置法61の4（定額控除800万・接待飲食費50%特例・1人1万円基準）と個人/法人の差を明記
- **#21 源泉徴収**: `rule-15`（支払報酬）の notes に士業報酬の源泉徴収（所得税法204条・10.21%/20.42%）を明記し No.2792 を citation 追加
- **#22 corpus**: `rule-04`(新幹線)・`rule-25`(会議費/来客)・`rule-29`(車両/ガソリン代) のパターン補完。ゴールデンコーパス precision を accountName 100% / taxCategory 100% / unmatched 0% に改善（旧 93.6%/94.9%/3.8%）
- golden corpus の「日経新聞 定期購読」期待税区分を `課税仕入10%`→`課税仕入8%（軽減税率）`に是正（正しい税法に整合）

### Deferred（証拠が確定しなかったため本リリースに含めない）

- **#20 外注費 vs 給与**: 根拠となる消費税法基本通達1-1-1 のページ本文を確認できず（取得時の文字化け）、ワークフロー提案の No.6475 も「出向・人材派遣」の文脈で不一致と判定。未検証 citation は採用せず issue を据え置き
- **#16**: 有価証券売却手数料の非課税（費用側の直接根拠なし）・社会保険診療（事業の健診は通常課税で誤適用リスク）・商品券（科目対応が不確実）は却下
- **#19**: 固定資産売却=課税売上（No.6201 は消極的証明のみで直接根拠なし）

## [0.5.0] - 2026-05-31

### Added

- `applicableEntity` フィールド（任意・既定 `both`）を journal-rule / account-item スキーマに追加。適用主体を `individual` / `corporation` / `both` で表現（#13 / C-1）
- `applicableYear` フィールド（任意・`{from, to}`）を journal-rule スキーマに追加。期間限定ルールの適用期間を表現（#14 / G-5）
- `rules/dataset-meta.json` + `schemas/dataset-meta.schema.json`: データセットの前提メタ（対象主体・課税方式＝原則課税）を宣言（#14 / G-5）
- `src/entity.ts`: `getApplicableEntity()` / `appliesToEntity()` ヘルパ。エクスポートサブパス `./entity` を追加
- `match(description, rules, entity?)`: 第3引数で適用主体を指定すると他方専用ルールを除外（未指定は後方互換で全ルール対象）
- `tests/entity-meta.test.ts`: 適用主体・適用年度・dataset-meta・主体↔典拠整合の回帰テスト

### Changed

- 全 38 ルール・全 51 科目に `applicableEntity` を付与（役員報酬 `rule-20` / 科目 `役員報酬` のみ `corporation`、他は `both`）
- インボイス経過措置ルール（`rule-15` 税理士等報酬 / `rule-18` 外注費）に `applicableYear: { from: "2023-10", to: "2026-09" }` を付与

### Fixed

- 勘定科目 `役員報酬`(id=62) の典拠を個人様式『青色申告決算書』から法人向け No.5211（役員に対する給与）へ是正。役員は法人固有概念で青色申告決算書に該当科目が無いため（#13 / C-1。既存 `rule-20` の検証済 No.5211 と整合）

## [0.4.0] - 2026-05-31

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
