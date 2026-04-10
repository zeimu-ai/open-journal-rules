# Open Journal Rules

日本の税務仕訳ルールのオープンソースデータセットです。

## 収録データ

| ファイル | 内容 | 件数 |
|---------|------|------|
| `rules/journal-rules.json` | 摘要パターン→勘定科目マッピング | 36パターン |
| `rules/account-master.json` | 勘定科目マスタ（国税庁 青色申告決算書ベース） | 31科目 |
| `rules/tax-categories.json` | 消費税区分マッピング | 17科目 |
| `rules/amount-thresholds.json` | 金額閾値ルール（国税庁 No.5403/5408） | 7段階 |
| `rules/citation-mapping.json` | 勘定科目→根拠番号マッピング | 32科目 |
| `rules/templates/*.json` | 業種別テンプレート | 13業種 |

## 使い方

```bash
npm install @zeimu-ai/open-journal-rules
```

```typescript
import rules from "@zeimu-ai/open-journal-rules/rules/journal-rules.json";

// 摘要からルールを検索
const matched = rules.find(rule =>
  rule.patterns.some(p => description.includes(p))
);
```

## 免責事項

本データセットは税務アドバイスを構成するものではありません。詳細は [DISCLAIMER.md](DISCLAIMER.md) を参照してください。

## ライセンス

[Apache License 2.0](LICENSE)

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
// 業種別テンプレートの読み込み
import restaurant from "@zeimu-ai/open-journal-rules/rules/templates/restaurant.json";
const allRules = [...rules, ...restaurant];
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
