# Open Journal Rules

日本の税務仕訳ルールのオープンソースデータセットです。

## 収録データ

| ファイル | 内容 | 件数 |
|---------|------|------|
| `rules/journal-rules.json` | 摘要パターン→勘定科目マッピング | 28パターン |
| `rules/account-master.json` | 勘定科目マスタ（国税庁 青色申告決算書ベース） | 28科目 |
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

## ライセンス

- ルールデータ（`rules/`）: [CC BY 4.0](LICENSE)
- コード（`tests/`）: [MIT](LICENSE-CODE)

## 根拠

全ルールは国税庁等の公式ドキュメントに基づいています。詳細は [docs/sources.md](docs/sources.md) を参照。

## 貢献

[CONTRIBUTING.md](CONTRIBUTING.md) を参照してください。根拠URLのないルールは受け付けません。
