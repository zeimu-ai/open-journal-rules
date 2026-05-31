# 設計提案: マッチング・ガバナンス（#46 / #35 / #36）

MECEレビュー指摘のうち、**エンジンAPIの拡張や横断的なガバナンス**を伴う3件について、後方互換を保った段階的実装の設計を提案する。本ドキュメントは設計提案であり、本PRではコード/データの破壊的変更は行わない（データ拡充は #68〜#71 の各PRで先行実施済み）。

> 数値は本ドキュメント作成時点（`main`・journal-rules 67件）の実測。`match(description, rules, entity?)` の現行シグネチャを前提とする。

---

## #46 [F-5] 業種別の科目差異が反映されない

### 現状
- マッチャーは業種コンテキストを受け取らない（`match(description, rules, entity?)`）。
- 業種別ルールは `rules/templates/*.json`（13業種）に分離され、利用者が `[...rules, ...template]` と**手動結合**して渡す運用。
- そのため「同じ『材料』でも製造／建設／飲食で科目が異なる」という業種依存を、エンジンが解決できない。

### 問題
- テンプレートを全結合すると、業種固有パターンが他業種の摘要に誤マッチするリスク（例: 医療テンプレの「診療報酬→非課税」が非医療事業者に適用される）。
- テンプレート統合ポリシー（ベースルールとテンプレの優先順位・衝突解決）が未定義。

### 提案: 業種コンテキストを第4引数で受け取る（後方互換・追加のみ）

```typescript
type Industry =
  | "restaurant" | "medical" | "realestate" | "it-saas" | "construction"
  | "manufacturing" | "retail" | "agriculture" | "logistics"
  | "wholesale" | "finance" | "education" | "beauty";

// 既存シグネチャは不変。industry を省略すれば従来どおり。
function match(
  description: string,
  rules: MatchRule[],
  entity?: ConcreteEntity,
  options?: { industry?: Industry },
): MatchResult[];
```

実装方針（いずれも**既存ルールの結果を変えない**＝MINOR）:
1. **テンプレートに `industry` タグを付与**（`templates/*.json` の各ルールに任意フィールド `industry` を追加。スキーマ拡張が必要だがテンプレ専用フィールドのため後方互換）。
2. `match()` 内で `options.industry` 指定時のみ、当該業種テンプレを**自動的にマージ対象に含める**（利用者の手動結合を不要に）。未指定なら従来どおりベースルールのみ。
3. **業種テンプレのルールに既定 `priority` を +1 付与**し、同一摘要でベースルールと衝突した場合は業種ルールを優先（例: 建設業コンテキストの「工事」→完成工事高系を優先）。

### テンプレ統合ポリシー（確立案）
| 観点 | ルール |
|------|--------|
| 適用条件 | `options.industry` が一致するテンプレのみマージ |
| 優先順位 | 業種テンプレ rule `priority` をベース既定（0）より高く設定 |
| 衝突解決 | 既存の `priority → matchedPattern.length → confidence` 順を踏襲 |
| 非適用業種への漏れ防止 | 業種未指定時はテンプレを一切ロードしない（現行の手動結合は引き続き可能） |

### 想定コスト: L（API・スキーマ・全テンプレへのタグ付け・回帰テスト）。段階導入可（まず `options.industry` の自動マージのみ→後で priority 調整）。

---

## #35 [F-2] 多義ベンダーの曖昧性解消

### 現状（実測）
| ベンダー | マッチ先 | excludePatterns |
|---------|---------|----------------|
| Amazon / 楽天 | rule-03 消耗品費 | `["Amazon Web Services","AWS","Kindle"]` |
| Apple / アップル | rule-05 通信費 | **空** |
| Google | rule-05 通信費 / rule-08 広告宣伝費 | **空** |

- Amazon は一部対応済みだが、Apple（App Store課金 vs ハード購入 vs 通信）/ Google（Workspace=通信費 vs Google Ads=広告宣伝費 vs Google Cloud=通信費）の文脈分離が不十分。

### 問題
- ベンダー名だけでは科目が一意に決まらず、**誤仕訳の温床**。現状は最長マッチ／優先度に依存し、文脈語（用途）を見ていない。

### 提案: 用途語との共起判定 ＋ 確信度低下 ＋ 複数候補返却

1. **`excludePatterns` の拡充（データ作業・非破壊・即効）**
   - rule-05（Apple/Google→通信費）に、広告系・ハード購入系の用途語を除外追加し、Google Ads は rule-08、Apple のハード購入は消耗品費/工具器具備品に流す。
   - 例（提案値）:
     - rule-05 excludePatterns に `["Google Ads","Google広告","リスティング","App Store 売上","Apple Store 端末","iPhone 購入","iPad 購入","Mac 購入"]`
     - rule-08（広告宣伝費）patterns に `["Google Ads","YouTube広告"]` を追加（既存と衝突確認のうえ）。
2. **曖昧ベンダー辞書（新データ `rules/ambiguous-vendors.json` 案）**
   - `{ vendor: "Google", candidates: [{ accountName:"通信費", whenContains:["Workspace","Cloud","GCP"] }, { accountName:"広告宣伝費", whenContains:["Ads","広告"] }] }` の形で、用途語→科目の対応を構造化。
3. **マッチャーの確信度ハンドリング**
   - 曖昧ベンダーが用途語なしでマッチした場合、`confidence` を下げ、`match()` が**複数候補を返す**ことを明示（利用者側で確認を促す）。現行 `match()` は配列を返すため、2位以降の候補を活かす運用を README 化。

### 想定コスト: M。①の excludePatterns 拡充だけなら S（即効・非破壊）。②③は新データ＋エンジン拡張。

---

## #36 [G-1] タックスアンサー偏重を是正し法令/通達へ遡及

### 現状（実測・main 67ルール）
| authority_level | citations 全体 | citations[0]（主根拠） |
|-----------------|:-------------:|:---------------------:|
| statute（法令） | 26 | 13 |
| notice（通達） | 12 | 7 |
| administrative_form（様式） | 6 | 6 |
| tax_answer（タックスアンサー） | 59 | **41** |

- `authority_level` の枠組みと statute/notice の実引用は **#47/#36（v0.16.0）で一部底上げ済み**（No.2210 catch-all 12ルールを所得税法37条・法人税法22条へ格上げ）。
- 一方、**主根拠 citations[0] の61%（41/67）が依然 tax_answer**。タックスアンサーは法的拘束力のない解説であり、一次根拠としては弱い。

> 本一括対応（#68〜#71）で、純資産（会社計算規則76条2項）・完成工事原価（法人税法22条3項1号）・家事按分（所得税法45条）等を **statute/ministerial_ordinance で追加**したため、最新ブランチでは statute/notice 比率がさらに改善している。

### 提案: 分布の可視化 ＋ statute/notice 底上げ ＋ タックスアンサー併記

1. **authority_level 分布の可視化（テスト/CI）**
   - `tests/` に「citations[0] が tax_answer のみのルール一覧を console.warn で可視化」する非失敗テストを追加（`citation-integrity.test.ts` の No.2210 警告と同方式）。劣化検知のベースラインにする。
2. **段階的格上げ計画（科目→法令/通達の対応表）**
   - tax_answer 主根拠の41ルールを、対応する条文・通達へ順次格上げ。優先は税務リスクの高い科目（交際費＝措置法61の4／租税公課＝地方税法等／減価償却＝耐用年数省令）。
   - 既存方針どおり**タックスアンサーは削除せず補助根拠（citations[1+]）として併記**（実務利用者の可読性を維持）。
3. **新規ルールの受入基準に「主根拠は可能な限り statute/notice」を明文化**
   - `CONTRIBUTING.md` に「`citations[0]` は条文・通達を優先し、タックスアンサーは補助」と追記する案。

### authority_level 規範強度（参考）
`statute（法律） > cabinet_order（政令） > ministerial_ordinance（省令） > notice（通達） > tax_answer（タックスアンサー） > administrative_form（様式）`
※様式は科目の存在根拠としては有効だが、課税関係の規範根拠としては最下位。

### 想定コスト: M（可視化はS、全面格上げはL）。可視化テスト→高リスク科目から段階格上げ、が現実的。

---

## 実装優先度（提案）

| 指摘 | 即効（S・非破壊） | 本格（M〜L） |
|------|------------------|-------------|
| #35 | excludePatterns 拡充（Apple/Google の用途分離） | 曖昧ベンダー辞書＋確信度低下 |
| #36 | tax_answer 主根拠ルールの可視化テスト | 高リスク科目の法令格上げ |
| #46 | （なし） | `options.industry` 自動マージ＋テンプレ priority |

いずれも**既存の `match()` 結果を変えない範囲＝MINOR** で着手可能。`#46` のみ API シグネチャ拡張（追加引数・後方互換）を伴う。

---

## 修正履歴
| 日時 | 内容 |
|------|------|
| 2026-06-01 | 初版作成（#46/#35/#36 の設計提案。authority_level 分布は main 実測） |
