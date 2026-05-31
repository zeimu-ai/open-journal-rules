# Open Journal Rules

日本の税務仕訳ルールのオープンソースデータセットです。

## 収録データ

| ファイル | 内容 | 件数 |
|---------|------|------|
| `rules/journal-rules.json` | 摘要パターン→勘定科目マッピング | 67パターン |
| `rules/account-master.json` | 勘定科目マスタ（国税庁 青色申告決算書ベース） | 75科目 |
| `rules/tax-categories.json` | 消費税区分マッピング | 17科目 |
| `rules/amount-thresholds.json` | 金額閾値ルール（国税庁 No.5403/5408） | 7段階 |
| `rules/citation-mapping.json` | 勘定科目→根拠番号マッピング | 49科目 |
| `rules/dataset-meta.json` | データセットの前提メタ（対象主体・課税方式） | 1件 |
| `rules/simplified-tax-rates.json` | 簡易課税の事業区分・みなし仕入率（国税庁 No.6505） | 6区分 |
| `rules/invoice-transitional.json` | インボイス経過措置（80%/50%控除・国税庁 No.6498） | — |
| `rules/useful-life.json` | 主な減価償却資産の法定耐用年数（国税庁 耐用年数表） | 10項目 |
| `rules/social-insurance-rates.json` | 社会保険料率（厚年/健保/介護/雇用保険/拠出金/労災・年金機構/協会けんぽ/厚労省） | 25件 |
| `rules/withholding-tax-rates.json` | 源泉徴収の税率・算出方式（報酬源泉/復興特別/賞与/給与税額表参照） | 4件 |
| `rules/standard-remuneration-grades.json` | 標準報酬月額等級表（健保50等級+厚年32等級+標準賞与額上限） | 82等級 |
| `rules/filing-deadlines.json` | 源泉納付・法定調書の提出期限（翌月10日/納期特例/翌年1月31日） | 5件 |
| `rules/templates/*.json` | 業種別テンプレート | 13業種 |

### 適用主体・課税方式の前提（v0.5.0〜）

本データセットは**個人事業主・法人の両方**を主対象とします。各ルール／科目は任意フィールド `applicableEntity`（`individual` / `corporation` / `both`、既定 `both`）で適用主体を表します。フィールドが無い場合はエンジン側で `both` とみなします（後方互換）。

- 例: 役員報酬（`rule-20` / 科目 `役員報酬`）は法人固有概念のため `corporation`。
- `match(description, rules, "individual")` のように第3引数で主体を渡すと、他方専用ルールを除外できます（未指定なら従来通り全ルールが対象）。
- 期間限定ルール（インボイス経過措置等）は任意フィールド `applicableYear`（`{from, to}`）で適用期間を表します。
- 消費税は**原則課税**を既定の前提とします（`rules/dataset-meta.json`）。簡易課税・2割特例の控除計算はコンシューマ側の責務です。

## 使い方

```bash
npm install @zeimu-ai/open-journal-rules
```

### 正典マッチャー（推奨）

v0.4.0 以降は組み込みの `match()` / `resolveJournalEntry()` を使ってください。
正規化・最長マッチ・優先度解決・除外パターンを自動で処理します。

```typescript
import { match } from "@zeimu-ai/open-journal-rules/matcher";
import rules from "@zeimu-ai/open-journal-rules/rules/journal-rules.json";
import type { MatchRule } from "@zeimu-ai/open-journal-rules/matcher";

const description = "AWS利用料 5月分";
const results = match(description, rules as MatchRule[]);

if (results.length > 0) {
  const best = results[0];
  console.log(best.rule.accountName); // "通信費"
  console.log(best.rule.taxCategory); // "課税仕入10%"
  console.log(best.rule.confidence);  // 0.95
}
```

### 摘要 + 金額 → 仕訳解決（`resolveJournalEntry`）

金額閾値（消耗品費の10万円・30万円ルール等）も考慮した統合APIです。

```typescript
import { resolveJournalEntry } from "@zeimu-ai/open-journal-rules/resolver";
import rules from "@zeimu-ai/open-journal-rules/rules/journal-rules.json";
import type { MatchRule } from "@zeimu-ai/open-journal-rules/matcher";

const result = resolveJournalEntry(
  "ノートPC購入 Dell XPS",  // 摘要
  95000,                     // 金額（円）
  rules as MatchRule[]
);

console.log(result.accountName);   // "消耗品費"
console.log(result.taxCategory);   // "課税仕入10%"
console.log(result.confidence);    // 0.9
console.log(result.thresholdRule); // "取得価額10万円未満は消耗品費として損金算入可"
```

### データ JSON の直接 import

生データを独自処理したい場合は各 JSON を直接 import できます。

```typescript
// 仕訳ルール
import rules from "@zeimu-ai/open-journal-rules/rules/journal-rules.json";
// 勘定科目マスタ
import accounts from "@zeimu-ai/open-journal-rules/rules/account-master.json";
// 消費税区分
import taxCategories from "@zeimu-ai/open-journal-rules/rules/tax-categories.json";
// 金額閾値ルール
import thresholds from "@zeimu-ai/open-journal-rules/rules/amount-thresholds.json";
```

### エクスポートサブパス一覧

| サブパス | 内容 |
|---------|------|
| `@zeimu-ai/open-journal-rules` | `rules/journal-rules.json`（デフォルト） |
| `@zeimu-ai/open-journal-rules/matcher` | `match()` 関数・型定義 |
| `@zeimu-ai/open-journal-rules/resolver` | `resolveJournalEntry()` 関数・型定義 |
| `@zeimu-ai/open-journal-rules/normalize` | `normalizeText()` ユーティリティ |
| `@zeimu-ai/open-journal-rules/entity` | `getApplicableEntity()` / `appliesToEntity()`（適用主体ヘルパ） |
| `@zeimu-ai/open-journal-rules/invoice-number` | 適格請求書登録番号(T+13桁)の抽出・検証 |
| `@zeimu-ai/open-journal-rules/rules/*` | 各データ JSON ファイル |
| `@zeimu-ai/open-journal-rules/schemas/*` | JSON Schema ファイル |

### v0 系からの移行

> **破壊的変更があります。** [MIGRATION.md](MIGRATION.md) を参照してください。

```typescript
// ❌ 非推奨（v0 系）: 正規化・衝突解決がされないため match() を使うこと
import rules from "@zeimu-ai/open-journal-rules/rules/journal-rules.json";
const matched = rules.find(rule =>
  rule.patterns.some(p => description.includes(p))
);
```

## 免責事項

本データセットは税務アドバイスを構成するものではありません。詳細は [DISCLAIMER.md](DISCLAIMER.md) を参照してください。

## ライセンス

[Apache License 2.0](LICENSE)

## 証憑・帳簿要件

インボイス保存要件・交際費の記載要件・電子帳簿保存法は [docs/evidence-bookkeeping-requirements.md](docs/evidence-bookkeeping-requirements.md) を参照。

インボイス経過措置や税制改正の期日は [docs/maintenance-calendar.md](docs/maintenance-calendar.md) を参照。

## 根拠・リサーチ

全ルールは国税庁等の公式ドキュメントに基づいています。

- [根拠URL一覧](docs/sources.md)
- [国税庁・弥生・freee・MF公式調査](docs/research/nta-research.md)
- [freee勘定科目マッピング](docs/research/freee-mapping.md)
- [ファクトチェック結果](docs/research/factcheck.md)
- [プリセット拡充調査](docs/research/expansion.md)
- [税理士の実務パターン調査](docs/research/practitioner-insights.md)
- [OpenTax等の参考プロジェクト](docs/research/opentax-reference.md)

## 業種別テンプレート

`rules/templates/` に業種別の追加ルールを収録しています。

| テンプレート | 業種 | ルール数 |
|------------|------|:-------:|
| `restaurant.json` | 飲食業（食材仕入・酒類仕入） | 2 |
| `medical.json` | 医療業（診療報酬・医薬品仕入） | 3 |
| `realestate.json` | 不動産業（管理費・賃貸収入） | 2 |
| `it-saas.json` | IT/SaaS（ソフトウェア・インフラ） | 2 |
| `construction.json` | 建設業（完成工事高・外注費） | 3 |
| `manufacturing.json` | 製造業（材料費・外注加工費） | 2 |
| `retail.json` | 小売業（商品仕入・軽減税率） | 2 |
| `agriculture.json` | 農業（種苗費・肥料費・農薬） | 3 |
| `logistics.json` | 運輸・物流（燃料費・車両修繕） | 2 |
| `wholesale.json` | 卸売業（商品仕入・荷造運賃） | 2 |
| `finance.json` | 金融・保険（支払利息・保険料） | 2 |
| `education.json` | 教育（教材費・施設使用料） | 2 |
| `beauty.json` | 美容・サービス（美容材料・講習費） | 2 |

```typescript
import { match } from "@zeimu-ai/open-journal-rules/matcher";
import rules from "@zeimu-ai/open-journal-rules/rules/journal-rules.json";
import restaurant from "@zeimu-ai/open-journal-rules/rules/templates/restaurant.json";
import type { MatchRule } from "@zeimu-ai/open-journal-rules/matcher";

// ベースルールと業種別テンプレートを結合してマッチング
const allRules = [...rules, ...restaurant] as MatchRule[];
const results = match("食材仕入 築地市場", allRules);
```

## 貢献

[CONTRIBUTING.md](CONTRIBUTING.md) を参照してください。根拠URLのないルールは受け付けません。

## バージョニング

[Semantic Versioning 2.0.0](https://github.com/zeimu-ai/.github/blob/main/VERSIONING.md) に準拠しています。

---

このプロジェクトは [Zeimu AI](https://zeimu.ai) が開発・メンテナンスしています。

### 関連プロジェクト

| プロジェクト | 内容 |
|------------|------|
| [open-journal-rules](https://github.com/zeimu-ai/open-journal-rules) | 日本の税務仕訳ルールのオープンソースデータセット |
| [open-freee-demo-kit](https://github.com/zeimu-ai/open-freee-demo-kit) | freeeサンドボックスにデモデータを一括投入するCLIツール |
| [open-industry-support-guide](https://github.com/zeimu-ai/open-industry-support-guide) | 金融庁『業種別支援の着眼点』のMarkdown + JSONデータセット |
