# Open Journal Rules

日本の税務仕訳ルールのオープンソースデータセットです。

## 収録データ

| ファイル | 内容 | 件数 |
|---------|------|------|
| `rules/journal-rules.json` | 摘要パターン→勘定科目マッピング | 33パターン |
| `rules/account-master.json` | 勘定科目マスタ（国税庁 青色申告決算書ベース） | 31科目 |
| `rules/tax-categories.json` | 消費税区分マッピング | 17科目 |
| `rules/amount-thresholds.json` | 金額閾値ルール（国税庁 No.5403/5408） | 5段階 |

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

## 貢献

[CONTRIBUTING.md](CONTRIBUTING.md) を参照してください。根拠URLのないルールは受け付けません。

---

このプロジェクトは [Zeimu AI](https://zeimu.ai) が開発・メンテナンスしています。
