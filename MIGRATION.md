# v0 → v1.0.0 移行ガイド

## なぜ MAJOR バージョンアップか

v1.0.0 は以下の **後方互換性のない変更** を含むため MAJOR になります。

1. **`patterns` が NFKC 正規化済み小文字前提に変更された**
   - v0 の `patterns` は元の表記（全角英字・大文字混在）のままでした
   - v1 では `patterns` をすべて `normalizeText()`（NFKC + toLowerCase + trim）適用後の文字列として格納しています
   - 呼び出し側が素朴に `description.includes(pattern)` を使っていた場合、全角入力や大文字入力に対して **従来と異なる結果** になりえます

2. **`taxCategory` が enum に変更された**
   - 許容値: `"課税仕入10%"` / `"課税仕入8%（軽減税率）"` / `"課税売上10%"` / `"非課税"` / `"不課税"` / `"免税"`（`schemas/tax-category-enum.json` 参照）
   - v0 では自由文字列だったため、表記揺れが存在する可能性があります。スキーマ外の値で条件分岐していたコードは修正が必要です

3. **`matchType` の意味論がマッチャー実装で定義された**
   - `"exact"` / `"prefix"` / `"partial"` の各値が `src/matcher.ts` の `match()` で正式実装されました
   - v0 ではこのフィールドを独自解釈していた場合、動作が変わります

---

## 移行手順

### (1) 自前の `includes()` 呼び出しを `match()` に切り替える

**Before (v0)**

```ts
import rules from "@zeimu-ai/open-journal-rules";

function findRule(description: string) {
  return rules.find((rule) =>
    rule.patterns.some((p) => description.includes(p))
  );
}
```

**After (v1)**

```ts
import rules from "@zeimu-ai/open-journal-rules";
import { match } from "@zeimu-ai/open-journal-rules/matcher";

function findRule(description: string) {
  const results = match(description, rules);
  return results[0]?.rule ?? null; // ベストマッチが先頭
}
```

### (2) 呼び出し側での正規化は不要

`match()` は内部で `normalizeText()`（NFKC + toLowerCase + trim）を実行します。
呼び出し側で事前に正規化しても問題はありませんが、**二重正規化になっても冪等**です。

```ts
// これは不要（match() が内部でやる）
const normalized = description.normalize("NFKC").toLowerCase().trim();
const results = match(normalized, rules);

// これで十分
const results = match(description, rules);
```

### (3) 複数マッチの扱い

`match()` は `priority（降順）→ matchedPattern.length（降順）→ confidence（降順）` でソート済みの配列を返します。

- `results[0]` がベストマッチです
- `score` フィールドはヒューリスティックな参考値であり、**順位の決定には使われません**（ソート基準は上記の3段階）
- 複数候補を確認したい場合は `results` 全体を走査してください

```ts
const results = match("アパート家賃 住宅用", rules);
// results[0].rule.id === "rule-38" (地代家賃（住宅用）, priority=1)
// results[1].rule.id === "rule-06" (地代家賃, priority=0)
```

### (4) 金額判定が必要な場合は `resolveJournalEntry` を使う

摘要と金額から資産計上/費用計上の判断が必要な場合は `resolver` を使います。

```ts
import { resolveJournalEntry } from "@zeimu-ai/open-journal-rules/resolver";

const result = resolveJournalEntry("Amazon 備品購入", 95000, rules);
// result.accountName     === "消耗品費"
// result.taxCategory     === "課税仕入10%"
// result.thresholdRule   === "10万円未満の消耗品は全額損金算入可（法人税法施行令第133条）"
// result.confidence      === 0.9
```

`thresholdRule` は `消耗品費` 科目のみ付加されます（通信費・会議費等には付加されません）。

---

## 破壊的変更の一覧

同一の入力テキストで **v0 と v1 で結果が変わりうる** 箇所を列挙します。

### ルールデータの変更

| 変更内容 | v0 の動作 | v1 の動作 |
|---|---|---|
| **地代家賃の分離**（rule-38 追加） | 「アパート」「住宅」を含む摘要は `地代家賃`（課税仕入10%）にマッチ | `地代家賃（住宅用）`（非課税、priority=1）が優先してマッチ |
| **法定福利費 citation 是正** | `No.6157` へのリンクがなかった | `No.6157`（社会保険料）を正典 citation として付加 |
| **研修費 citation 是正** | `セミナー代`等を `課税仕入10%` としてマッチ、citation 根拠が不明確 | 青色申告決算書を authority source として明示、税区分は維持 |
| **損害保険料パターン具体化** | 汎用「保険料」でマッチしていた | `損害保険` / `火災保険` / `自動車保険` / `賠償責任保険` / `共済掛金` のみマッチ（「保険料」単独は非マッチ） |
| **会議費の非課税基準を 1 万円に改定** | 5,000 円基準で注記 | 1 万円基準（法改正後の措置法61の4）を notes に明記 |
| **テンプレート間の重複パターン解消** | 複数テンプレートに同一パターンが存在し、どちらがマッチするか非決定的 | 重複を除去し、priority または excludePatterns で衝突を解消 |
| **SaaS citation 是正**（rule-05） | citation 欠損または誤 No. | `No.6118`（海外からの役務提供）を正典 citation として付加 |
| **外注工賃 citation 是正**（rule-18） | citation 根拠が不明確 | `No.6498` を正典 citation として付加 |

### `patterns` 正規化による動作変化

| 入力例 | v0 の結果 | v1 の結果 |
|---|---|---|
| `"ＵＱモバイル 通信費"` | `description.includes("UQ mobile")` → false（非マッチ） | `match()` 内部で NFKC 正規化後に比較 → `通信費` にマッチ |
| `"AMAZON 消耗品"` | `"Amazon"` の大文字比較 → 非マッチの可能性あり | toLowerCase 後に比較 → `消耗品費（EC）` にマッチ |

---

## 新フィールド一覧

v1.0.0 で追加された `journal-rules.json` の新規フィールドです。これらは **オプショナル** であり、未存在のルールは従来通り動作します。

| フィールド | 型 | 説明 | 例 |
|---|---|---|---|
| `priority` | `number` (省略可、デフォルト 0) | ルールの優先度。大きいほど `match()` 結果で上位に来る | `rule-38` (地代家賃 住宅用): `1` |
| `excludePatterns` | `string[]` (省略可) | 説明文にこの文字列が含まれたらルールを除外 | `rule-02` (水道光熱費): `["ガスター", "ガスコンロ"]` |
| `citations[].authority_level` | `string` | 根拠の権威レベル。`"tax_answer"` / `"administrative_form"` 等 | `rule-01`: `"tax_answer"` |
| `invoiceRequired` | `boolean` (省略可) | インボイス対応で仕入税額控除に適格請求書が必要な科目 | `rule-15` (税理士等報酬): `true` |
| `transitionalDeductionRate` | `number` (省略可) | インボイス経過措置の控除率（例: 0.8 = 80%） | `rule-18` (外注費): `0.8` |

### `invoiceRequired` / `transitionalDeductionRate` の使い方

```ts
const results = match("外注費 デザイン", rules);
const rule = results[0]?.rule;

if (rule?.invoiceRequired) {
  const rate = rule.transitionalDeductionRate ?? 1.0;
  console.log(`適格請求書が必要です（経過措置控除率: ${rate * 100}%）`);
}
```

---

## セマンティック バージョニング ポリシー（v1 以降）

| 変更の種類 | バージョン |
|---|---|
| パターンの追加・ルールの新規追加 | MINOR |
| パターンの意味変更・taxCategory の変更・破壊的 API 変更 | MAJOR |
| バグ修正・citation の補完・URL 修正 | PATCH |

---

## 修正履歴

| 日時 | 内容 |
|---|---|
| 2026-05-31 | 初版作成（v0 → v1.0.0 移行ガイド） |
