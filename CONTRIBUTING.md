# 貢献ガイドライン

## Contributor License Agreement (CLA)

本プロジェクトへの初めてのプルリクエスト時に、[CLA（Contributor License Agreement）](CLA.md) への同意が求められます。

CLA は、あなたの著作権を保持したまま、プロジェクトにコントリビューションの使用権をライセンス付与する合意です。CLA Assistant Bot が PR 上で自動的に同意を求めますので、指示に従って署名してください。

## ルール追加のルール

新しい仕訳ルールを追加する場合、以下を守ってください:

1. **根拠URL必須**: 国税庁・公式ドキュメントのURLを必ず記載
2. **JSON形式**: `rules/journal-rules.json` の既存フォーマットに従う
3. **テスト追加**: `tests/rules.test.ts` にテストケースを追加

## ルールのフォーマット

```json
{
  "id": "rule-29",
  "name": "ルール名",
  "patterns": ["キーワード1", "キーワード2"],
  "matchType": "partial",
  "accountName": "勘定科目名",
  "taxCategory": "課税仕入10%",
  "confidence": 0.90,
  "sourceUrl": "https://...",
  "notes": "補足事項"
}
```

## 根拠のないルールは受け付けません

「一般的にこう処理する」だけでは不十分です。必ず公式ドキュメントのURLを添えてください。

## バージョニング

本リポジトリは [Semantic Versioning 2.0.0](https://github.com/zeimu-ai/.github/blob/main/VERSIONING.md) に準拠しています。ルール追加・修正はPATCH、新フィールド追加はMINOR、破壊的変更はMAJORバージョンを上げます。
