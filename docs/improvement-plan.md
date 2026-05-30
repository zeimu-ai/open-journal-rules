# open-journal-rules 改善設計・実装計画

> 多角レビュー（6次元 × 専門エージェント → 統合 → 敵対的検証 → 最終化）で洗い出した改善点と段階計画。
> P0 指摘は実ファイルで事実確認済み。

## エグゼクティブサマリー

37件の仕訳ルールデータセットとして公開されているが、**消費税申告に直接影響する P0 欠陥が複数**存在し、設計・品質面でも構造的な穴がある。最緊急は次の3点（いずれも実ファイル確認済み）:

1. **`rule-06` 地代家賃の `taxCategory` が「非課税」固定**（`journal-rules.json:171`）。事業用賃料は本来課税仕入10%で、このままでは仕入税額控除が全額失われる過大納付リスク。根拠も No.6201（＝非課税取引の解説ページ）で課税根拠になっていない。
2. **`rule-11`/`rule-21` 法定福利費（不課税）が No.6201（非課税取引）を誤引用**。誤りが `citation-mapping.json` にも転写され、整合テストが「誤りを正」と判定して CI を通過し続けている。
3. **`rule-14` 研修費が No.1410（給与所得者の特定支出控除）を引用**。事業者の必要経費根拠にならず、税務調査で根拠が崩れる。

加えて構造的欠陥として、**正規化の不在**（全角・大文字の銀行明細がほぼ全滅でマッチしない）、**衝突解決の不在**（同一摘要が複数ルールにマッチし税区分が実装依存で決まる）、**テンプレ29件がスキーマ未検証**、**精度計測手段（ゴールデンコーパス）の不在**がある。

---

## 改善バックログ（優先度付き）

凡例: 優先度 P0（税務正確性・データ毀損）/ P1（設計・運用上重要）/ P2（改善余地）、規模 S/M/L。

### P0 — 即時修正（税務誤り・事実誤り・前提整備）

| ID | 内容 | 規模 |
|----|------|:--:|
| B-00 | **mini-corpus（20-30件）を `tests/golden/mini-corpus.json` に作成**し精度ベースラインを確立（全変更の前後比較の前提） | S |
| B-12 | 件数ハードコード（`toHaveLength(37/31/17/7)`）を不変条件テストに置換（**B-01 より先に実施しないと CI failure**） | S |
| B-01 | rule-06 地代家賃 → 課税仕入10%、住宅用を別ルール分離、citation を No.6225 に。`account-master` id:25 / `citation-mapping` も同時修正 | S |
| B-02 | rule-11/21 の citation を No.6201 → **No.6209**、`citation-mapping` の法定福利費も修正 | S |
| B-03 | rule-14 研修費の citation を No.1410 → 青色申告決算書に差替 | S |
| B-05 | tmpl-construction-02 未成工事支出金の税区分修正 + notes に「支払側/受取側」区別注意 | S |
| B-14 | rule-37 の notes と **citations[0].reason 両方**の「5,000円」を「1万円」に統一（R6.4.1改正） | S |
| B-06 | citation-integrity を全 citations ループ検証に強化（科目横断チェックは1対1科目に限定し偽陽性回避） | S |
| B-30 | README「36パターン」→「37パターン」 | S |

### P1 — スキーマ強化・正典マッチャー

| ID | 内容 | 規模 |
|----|------|:--:|
| B-04 | `taxCategory`/`taxDefault` を **enum 化**（非課税/不課税の取り違えを CI で弾く） | S |
| B-10 | テンプレ29件をスキーマ検証対象に追加（id パターン拡張）+ freshness もスコープ拡張 | M |
| B-11 | accountName 参照整合性テスト + account-master 不在の **21科目**（本体7 + テンプレ14）を追加 | M |
| B-17 | account-master id:33/34/35 の空 citation を補完 | S |
| B-18 | package.json の exports/types/files/engines 整備、schemas/ を配布、tsx 追記 | S |
| B-07 | **NFKC-lower 正規化**仕様確立 + `src/normalize.ts`（※破壊的変更の可能性。Open Q 参照） | M |
| B-08 | `priority` フィールド追加で衝突解決を実装依存から脱却 | M |
| B-09 | **`src/matcher.ts` 正典マッチャー**（matchType + 衝突解決 + exclude） | M |
| B-13 | `excludePatterns` 追加（「ガス」→ガスター、「バス」→バスタオル の誤マッチ防止） | M |
| B-15 | パターン衝突検出テスト `collision.test.ts` を新設し CI 化 | M |
| B-20 | テンプレ vs 本体の重複14件の統合ポリシー定義（ENEOS 等の科目衝突解消） | M |
| B-21 | rule-10 損害保険料のパターン具体化（「保険」2文字が社会保険に誤マッチ） | S |
| B-22 | threshold-03 少額減価償却特例の要件追記（**従業員数要件は No.5408 現行版を確認**） | S |
| B-19 | **インボイス制度フィールド**（invoiceRequired / 経過措置控除率）※2026-09-30 期限リスク | L |

### P2 — エビデンス格付け・統合API・ガバナンス

| ID | 内容 | 規模 |
|----|------|:--:|
| B-23 | ゴールデンコーパス（50件以上）で precision/recall を CI 計測 | L |
| B-24 | citation に `authority_level` enum（法令/通達/タックスアンサー の権威階層） | M |
| B-25 | No.2210 単独使用（**12科目**）を CI 警告化し科目固有 citation へ段階置換 | L |
| B-26 | `src/resolver.ts` 統合解決API（摘要+金額 → 仕訳エントリ） | L |
| B-27 | CONTRIBUTING に追加基準（汎用性・衝突チェック・confidence ルーブリック）明文化 | S |
| B-28 | rule-05 クラウドSaaS のリバースチャージ注意 + Kindle 分離（断定回避） | M |
| B-29 | rule-17 から資格更新料を分離（課税）+ account-master id:31 examples 更新 | S |
| B-31 | rule-36 前払費用の notes に仕入税額控除の計上タイミング説明を追加 | S |

---

## 段階実装計画（精緻版）

各 Phase は独立 PR。ブランチ命名: `fix/phase0-tax-corrections` / `feat/phase1-schema-hardening` / `feat/phase2-canonical-matcher` / `feat/phase3-evidence-invoice`。
TDD（Red→Green→Refactor）厳守。行番号は 2026-05-31 時点の実測値（Phase 0 で変動するため Phase 1 以降は file:識別子 で指定）。

---

### Phase 0 — 税務誤り・事実誤りの即時修正（1-3日 / スキーマ変更なし）

**ゴール**: 消費税申告に直接影響する P0 データ誤りを、精度ベースラインで前後比較しながら修正する。
**実行順序（厳守・依存関係）**: B-00 → B-12 → B-30 → B-01 → B-02 → B-03 → B-05 → B-14 → B-06 → 精度再測定

> ⚠️ B-12 を B-01 より先に実施しないと、rule-38 追加時点で `toHaveLength(37)` が即 CI failure。

#### B-00 精度ベースライン
- 新規 `tests/golden/mini-corpus.json`: 20-30件の `{input, expectedAccountName, expectedTaxCategory}`。**架空摘要**（決定#5）。P0該当科目（地代家賃の事業用/住宅用、法定福利費、研修費、未成工事支出金、接待交際費）を必ず含む
- 新規 `tests/golden.spec.ts`(暫定): 現行の素朴 `includes()` で precision/recall を算出しログ出力（この時点では assert せず基準値記録）
- **DoD**: `npm test` でベースライン precision/recall がコンソール出力される

#### B-12 件数ハードコード撤廃
- `tests/rules.test.ts:9,56,79,85` の `toHaveLength(37/31/17/7)` を削除
- 代替の不変条件テスト（スナップショット方式は**不採用**・決定通り）:
  - `id` 重複ゼロ / 必須フィールド全件存在 / `taxCategory` が許容4値（`課税仕入10%`/`課税売上10%`/`非課税`/`不課税`）内 / `confidence ∈ [0,1]`
- **DoD**: ルール追加で件数テストが壊れない。不変条件違反は検出する

#### B-30 README件数
- `README.md:9` `36パターン` → `37パターン`
- **DoD**: 実件数と一致

#### B-01 rule-06 地代家賃（最重要P0）
- `journal-rules.json` rule-06: `taxCategory` `非課税`→`課税仕入10%`、`notes` `住宅は非課税、事務所は課税`→`事業用（事務所・店舗・駐車場）は課税仕入10%。住宅用賃料は非課税（rule-38）`、citation `No.6201/非課税となる取引/…6201.htm`→`No.6225/地代、家賃や権利金、敷金など/…6225.htm`（※同ページが「事務所等の家賃は課税」「住宅の貸付けは非課税」を両方明示。一次確認済み。当初案 No.6229 は別内容＝商品券のため誤り）
- **rule-38 新設**: 住宅用賃料（patterns 例: `住宅`,`アパート`,`マンション家賃`,`社宅`）/ `accountName:地代家賃` / `taxCategory:非課税` / citation `No.6225`（住宅の貸付け＝非課税の根拠）/ rule-06 より優先（Phase 2 で `priority` 付与、Phase 0 では patterns の具体性で先行）
- `account-master.json` id:25（line 358-377）: `taxDefault` `非課税`→`課税仕入10%`、`description` `事務所・駐車場賃料`→`事業用（事務所・店舗・駐車場）賃料は課税／住宅用は非課税`、citation を No.6225 に
- `citation-mapping.json:6`: `{"tax":"非課税","expectedNumbers":["No.6201"]}`→`{"tax":"課税仕入10%","expectedNumbers":["No.6225"]}`
- **書くテスト**: mini-corpus に「事務所家賃 ◯◯ビル→地代家賃/課税仕入10%」「賃貸マンション家賃→地代家賃/非課税」を追加し両方 pass
- **DoD**: 事業用賃料が課税仕入10%で解決。住宅用が非課税で解決。citation-integrity green

#### B-02 法定福利費 citation（P0）
- rule-11 / rule-21 の citation `No.6201`（非課税となる取引）→ `No.6209`（非課税と不課税の違い・`…/shohi/6209.htm`）。両ルールとも `taxCategory:不課税` は維持
- `citation-mapping.json:11`: `expectedNumbers ["No.6201"]`→`["No.6209"]`
- **DoD**: 不課税科目が非課税ページを参照しない。citation-integrity green

#### B-03 研修費 citation（P0）
- rule-14 citation `No.1410/給与所得者の特定支出控除`（給与所得者専用）→ 青色申告決算書（`https://www.keisan.nta.go.jp/r5yokuaru/aoiroshinkoku/hitsuyokeihi/index.html`）。`taxCategory:課税仕入10%` 維持
- `citation-mapping.json:14`: `expectedNumbers ["No.1410"]`→`["青色申告決算書"]`
- **DoD**: 事業者の必要経費根拠として妥当な citation に

#### B-05 未成工事支出金（P0）
- `templates/construction.json` tmpl-construction-02: `taxCategory` `不課税`→ 適切な区分（個々の支出は課税仕入が含まれるため原則 `課税仕入10%`）。`notes` に追記: `本ルールは支払側（発注者）の処理を対象。受取側（受注者）が受け取る着手金は前受金として処理する`
- **理由**: patterns（`工事前払`/`着手金`/`工事着手`/`手付金`）は支払側/受取側を摘要だけで判別不能のため注意書き必須
- **DoD**: 建設業者の仕入税額控除が一律ゼロにならない

#### B-14 会議費基準の改正反映（P0・R6.4.1）
- `journal-rules.json:669`（rule-37 notes）と `:677`（reason）の**両方**の `5,000円` → `1万円`（改正後の交際費除外基準）
- **DoD**: rule-37 notes/reason と rule-25 notes（`1人1万円以下`）が新基準で整合

#### B-06 citation-integrity 強化
- `tests/citation-integrity.test.ts`: `citations[0]` のみ → **全 citations ループ**検証（全件に source/number/url/verified_at 存在、url が https）
- `taxCategory` vs `citation-mapping.tax` の科目横断チェックは**1 accountName に 1 taxCategory が一意な科目のみに限定**（rule-34 健康診断=課税 / rule-35 慶弔=不課税 が同一「福利厚生費」で偽陽性になるため除外）
- **DoD**: 既存データで green、かつ意図的に number を空にすると fail する

**Phase 0 完了条件**: `npm test` 全 green / mini-corpus 前後比較で P0 該当摘要の precision が改善（悪化ゼロ）/ PR `fix/phase0-tax-corrections`

---

### Phase 1 — スキーマ強化・参照整合性・CI 拡充（約1週間）

**ゴール**: 将来の誤りを機械的に防ぐ。スキーマ変更を伴う（後方互換）。

| ID | 仕様 | テスト表明 / DoD |
|----|------|------------------|
| B-04 | `journal-rule.schema.json` の `taxCategory` を `enum:["課税仕入10%","課税仕入8%（軽減税率）","課税売上10%","非課税","不課税","免税"]` に。`account-item.schema.json` の `taxDefault` も enum 化。新規 `rules/tax-category-enum.json` を正典値リストに。`schemaVersion` フィールド導入（参考プロジェクト準拠）。**citation number の正規表現制約は追加しない（決定#8）** | 不正な税区分文字列で AJV が fail |
| B-10 | `id` パターンを `^(rule-\d+\|tmpl-[a-z]+-\d+)$` に拡張。`schema.test.ts` に `templates/*.json` の glob ループ追加（全29件 AJV）。`freshness.test.ts` も templates glob を追加 | テンプレ29件が schema + 鮮度検証対象に |
| B-11 | `rules.test.ts` に accountName 参照整合性テスト追加。`account-master.json` に不在**21科目**追加（本体7: 給料手当/役員報酬/預り金/未払金/会議費/仕入高/前払費用 + テンプレ14: 種苗費/肥料費/農薬衛生費/完成工事高/未成工事支出金/外注費/支払利息/ソフトウェア/燃料費/材料費/外注加工費/管理諸費/賃貸料 等） | 全 accountName が master に存在 |
| B-17 | `account-master.json` id:33/34/35 の空 citation（number/title=空）を補完（車両費 No.2210 / リース料 No.5704 / 賞与 No.2523）。`account-item.schema.json` の citations.items.number に `minLength:1` | 空 citation で fail |
| B-18 | `package.json` に `exports`（`./rules/*`,`./schemas/*`）/`types`/`files` に schemas・dist 追加 /`engines:{node:">=14.13.0"}` / devDeps に tsx。`tsconfig.json` に outDir・declaration | TS プロジェクトで型が効く / schemas が npm 同梱 |
| B-22 | `amount-thresholds.json` threshold-03 notes に追記: `資本金1億円以下・青色申告・常時使用従業員500人以下（特定法人300人以下）・令和8年3月31日まで`（**500人**で確定・No.5408 一次確認済み） | notes が現行法令と一致 |
| B-27 | `CONTRIBUTING.md` に追加基準（汎用性確認・衝突チェック手順・confidence ルーブリック表）+ SemVer 改訂（**パターン変更=MINOR / 税区分変更=MAJOR**・決定#7） | 貢献者基準が明文化 |

**完了条件**: 全テスト green / テンプレCI が衝突・スキーマ違反を検出 / PR `feat/phase1-schema-hardening`

---

### Phase 2 — 正典マッチャー・正規化・衝突解決（2-3週間 / TDD / **MAJOR 候補**）

**ゴール**: 利用側の実装依存を解消。**v1.0 への MAJOR リリース**（決定#2）。
**実行順序**: B-07 → B-09 → B-08 → B-13 → B-15 → B-21 → B-20

| ID | 仕様（シグネチャ / スキーマ差分） | テスト表明 |
|----|----------------------------------|------------|
| B-07 | `src/normalize.ts`: `normalize(s:string):string = s.normalize('NFKC').toLowerCase().trim()`。patterns を正規化済みに統一。**注意**: 削減できるのは全角/半角重複のみ（英字/カナ表記ゆれは残る）。`schemas` に `normalization:"NFKC-lower"` 宣言 | `normalize.test.ts`: `ＮＴＴ`→`ntt`、`ＡＷＳ`→`aws` 等 Red→Green |
| B-09 | `src/matcher.ts`: `match(description:string, rules:Rule[], opts?):MatchResult[]`。処理: normalize → matchType switch（exact/prefix/partial）→ excludePatterns 評価 → priority降順+longest-match ソート。`MatchResult={rule, matchedPattern, score}` | `matcher.test.ts`: 衝突ケース（税理士会費→諸会費/不課税が勝つ）を assert |
| B-08 | `journal-rule.schema.json` に `priority:integer`(optional,default:0,小さいほど高優先)。全37件+rule-38 に付与。短い汎用パターン（保険/給与/ガス）は低優先 | priority 順で期待ルールが勝つ |
| B-13 | `journal-rule.schema.json` に `excludePatterns:string[]`(optional)。rule-02 ガス→`["ガスター","ガスコンロ","ガスケット"]`、rule-04 バス→`["バスタオル","バスマット","バスソルト"]`、rule-03 Amazon→`["Amazon Web Services","AWS","Kindle"]` | `ガスター10`→水道光熱費にマッチしない |
| B-15 | `tests/collision.test.ts` 新設: partial ルール間で pattern の substring 包含を検査、accountName/taxCategory 不一致なら fail。`package.json` の validate スクリプトに組込 | 既知7衝突が検出される |
| B-21 | rule-10 損害保険料 patterns `["保険","共済"]`→`["損害保険","火災保険","自動車保険","賠償保険","共済掛金"]`。生命保険の独立ルール（不課税・損金算入不可 notes） | `社会保険料`が損害保険料に誤マッチしない |
| B-20 | テンプレを**業種固有科目のみに限定**し重複14件削除（決定#4）。ENEOS/出光等は本体 rule-29 に集約。`scripts/validate-template-overlap.ts` 新設。`industries`タグ一本化案は**不採用** | 統合時に accountName 衝突ゼロ |

**成果物**: `src/normalize.ts`/`src/matcher.ts`/`collision.test.ts`/`validate-template-overlap.ts`/**MIGRATION.md**（v0→v1・README サンプルを matcher.ts 利用に更新・`includes()` 非推奨告知）
**完了条件**: `npm run validate` green / 移行ガイド公開 / PR `feat/phase2-canonical-matcher` → **v1.0.0**

---

### Phase 3 — エビデンス格付け・インボイス・ゴールデンコーパス（1-2ヶ月）

**ゴール**: OSS 品質の完成。**B-19 インボイスは 2026-09-30 の80%経過措置終了が近く Phase 2 末から前倒し着手**（決定#3）。

| ID | 仕様 | テスト/DoD |
|----|------|-----------|
| B-19 | **rule 単位フィールド**（決定#3）: `journal-rule.schema.json` に `invoiceRequired:boolean`(optional)・`transitionalDeductionRate:number\|null`(optional,0.8/0.5)。rule-18 外注費等の免税事業者リスク高カテゴリに付与。仕入先マスタは**作らない**。CONTRIBUTING に経過措置期限（80%:~2026-09-30 / 50%:~2029-09-30）注記 | フィールドが AJV 検証される |
| B-24 | citation に `authority_level:enum["statute","ministerial_ordinance","notice","tax_answer","administrative_form"]`。参考プロジェクトの`zeimuExtensions`流に**原典由来（citations）と独自判断（confidence/notes/patterns）を構造的に分離** | 全 citation に格付け付与 |
| B-16 | rule-25 会議費に法基通9-7-15-2（authority_level:notice）追加。`amount-thresholds.json` に threshold-08（会議費1万円基準） | 会議費に固有根拠 |
| B-25 | No.2210 単独使用**12科目**を citation-integrity で CI 警告化。優先科目（外注工賃→法基通2-2-12 / 通信費→No.6157 / 広告宣伝費→No.6105 等）から段階置換 | No.2210 単独使用が警告 |
| B-23 | `tests/golden/corpus.json` を**架空サンプル50件+**に拡充（決定#5・実データ不使用）。`golden.test.ts` で matcher.ts 使用し precision ≥ 0.95 を CI 強制 | precision ≥ 0.95 で gate |
| B-26 | `src/resolver.ts`: `resolveJournalEntry(description, amount, rules, opts?):ResolveResult`（摘要→科目→amount-threshold上書き→税区分のパイプライン）。TDD | `resolver.test.ts` で10万円閾値の科目上書きを assert |
| B-28 | rule-05 クラウドSaaS にリバースチャージ注意書き（断定回避）。rule-13 から Kindle 分離し `Amazon.co.jp経由は課税仕入10%・海外ストア直接は要検討` notes | 注意書きが過度に断定的でない |
| B-29 | rule-17 から「資格更新」分離→課税仕入10%独立ルール（消基通5-5-3）。`account-master.json` id:31 諸会費の examples から「資格更新」削除 | 資格更新料が課税で解決 |
| B-31 | rule-36 前払費用 notes に `仕入税額控除は役務提供時（費用振替時）に計上` 追記 | 「一切控除なし」の誤解防止 |

**成果物**: 格付け+インボイス スキーマ / `corpus.json`(50件+) + `golden.test.ts` / `src/resolver.ts` / CHANGELOG ルール単位記録 / **md形式の根拠解説の自動生成**（参考プロジェクトの二形式パターン・任意）
**完了条件**: precision ≥ 0.95 / インボイス期限前リリース / PR `feat/phase3-evidence-invoice`

---

## 工数サマリ・タイムライン

| Phase | 規模内訳 | 目安期間 | 並行可否 |
|-------|---------|---------|---------|
| Phase 0 | S×9 | 1-3日 | 順序依存（直列） |
| Phase 1 | S×4 + M×3 | 約1週間 | B-04→B-10/B-11 は順序、他は並行可 |
| Phase 2 | M×7 | 2-3週間 | B-07→B-09 は直列、B-13/B-21/B-15 は並行可 |
| Phase 3 | L×3 + M×2 + S×4 | 1-2ヶ月（B-19のみ前倒し） | B-23→B-26 は直列 |

## リスク登録簿

| リスク | 影響 | 対策 |
|-------|------|------|
| B-07 正規化で既存 `includes()` 利用者が全件 NO MATCH | 利用側の自動仕訳停止 | v1.0 MAJOR + MIGRATION.md で明示告知（決定#2） |
| B-19 が2026-09-30 経過措置終了に間に合わない | インボイス控除率の誤計算 | Phase 2 末から前倒し着手（決定#3） |
| 架空コーパスのみで現実精度と乖離 | precision 指標の代表性低下 | 摘要の表記バリエーション（全角・略称・店舗付き）を意図的に網羅（決定#5の制約を補償） |
| Phase 0 のデータ修正が他ルールの衝突を誘発 | 別科目の誤仕訳 | collision テスト（Phase 2）まではレビュー + mini-corpus 前後比較で担保 |
| 従業員数要件等の法令が今後改正 | notes 陳腐化 | freshness テスト + authority_level で再検証トリガー |

---

## 参考: open-industry-support-guide から移植すべき設計パターン

姉妹プロジェクト [open-industry-support-guide](https://github.com/zeimu-ai/open-industry-support-guide) の設計から流用価値の高いもの:

| パターン | 参考実装 | 本リポジトリへの適用 |
|---|---|---|
| **原典由来と独自付加の物理分離**（`zeimuExtensions`） | `"note":"金融庁原典には含まれません"` で独自情報を分離 | `confidence`・`notes`・`patterns`（＝Zeimu独自判断）と `citations`（＝国税庁原典）を構造的に分離。**B-24 authority_level と統合**してエビデンスの強さを明確化 |
| **リッチな `source` provenance 文字列** | `金融庁『…』（2023年3月公表, 2026年3月補足 P.15-23）URL` を一文に凝縮 | bare URL でなく **番号・タイトル・改正年・参照日** を1文の正規 provenance に（B-01〜B-03 の citation 修正と同時に検討） |
| **二形式（md人間向け + json機械向け）を単一ソースから生成** | `industries/*.md` ↔ `data/*.json` | 根拠の**人間可読な解説md自動生成**で貢献者レビュー・税務監査を容易化 |
| **スキーマ互換バージョンの明示**（"Agent 3互換スキーマ"） | README で互換スキーマを宣言 | `schemaVersion` を導入（B-04 enum 化と同時） |
| **安定ID階層 + jq/消費例の明示** | `food-fin-01` 等 + jq 例 | consumer ergonomics（B-18 と整合） |
| **判定補助メタ**（`benchmarks` / `keyQuestion`） | 業界目安・問いを構造化 | 金額閾値・除外条件・多義時の判定質問を構造化（B-13/B-26 と整合） |

---

## 確定事項（Decisions — 2026-05-31 確定）

| # | 論点 | 決定 |
|---|------|------|
| 1 | **rule-06 修正方針** | **(A) 課税仕入10%デフォルト + 住宅用を別ルール（rule-38・非課税）に分離**。citation は **No.6225「地代、家賃や権利金、敷金など」**（事業用＝課税／住宅＝非課税を両方明示・一次確認済み）。※当初案 No.6229 は別内容のため不採用 |
| 2 | **正規化（B-07）のバージョン判定** | **MAJOR（v0→v1.0）+ MIGRATION.md**。パターン変更は今後 MINOR に格上げ。利用側に明示的対応を促す |
| 3 | **インボイス（B-19）の設計と着手** | **(A) rule 単位フィールド（invoiceRequired / 経過措置控除率）+ Phase 2 末から前倒し着手**。仕入先マスタは持たず転区判定に限定 |
| 4 | **テンプレ統合方針（B-20）** | **(A) テンプレを「本体にない業種固有科目のみ」に限定し重複パターンを削除** |
| 5 | **ゴールデンコーパス（B-23）のデータ** | **架空サンプルのみで構築**（公開可能性優先。顧問先実データは使わない） |
| 6 | **threshold-03 従業員数要件（B-22）** | **常時使用従業員500人以下（特定法人300人以下）**。No.5408 現行版で一次確認済み。適用期限は令和8年3月31日まで（維持） |
| 7 | **バージョニングポリシー** | **パターン変更=MINOR、税区分等の意味変化=MAJOR に格上げ**して CONTRIBUTING に明記 |
| 8 | **citation number のスキーマ制約** | **緩めに保つ**（minLength:1 のまま、citation-mapping の expectedNumbers 照合で間接検証）。将来の通達・法令追加を妨げない |

### 決定の実装への反映
- B-01: rule-38（住宅用賃料・非課税）を新設、rule-06 を課税仕入10%、citation No.6225（rule-06・rule-38 とも同一ページが根拠）
- B-07/B-09: MAJOR リリース前提で MIGRATION.md を Phase 2 成果物に追加。CONTRIBUTING の SemVer 節を「パターン変更=MINOR / 税区分変更=MAJOR」に改訂
- B-19: `invoiceRequired: boolean` + `transitionalDeductionRate: number|null` を rule 単位 optional フィールドとして Phase 2 末に前倒し
- B-20: テンプレから重複パターンを削除し業種固有科目に限定。`industries` タグ一本化案（旧B案）は不採用
- B-22: notes に「資本金1億円以下・青色申告・常時使用従業員500人以下（特定法人300人以下）・令和8年3月31日まで」を記載
- B-23: corpus.json は架空摘要のみ。`.gitignore` での実データ別管理は行わない
- B-04: taxCategory enum は維持しつつ citation number の正規表現制約は追加しない

---

## 修正履歴
| 日時 | 内容 |
|------|------|
| 2026-05-31 | 初版作成（多角レビュー workflow の成果を統合） |
| 2026-05-31 | Open Questions 8件をユーザー確定（決定事項テーブル追加）。Phase 0-3 を実装着手レベルに精緻化（file:line・before→after・DoD・TDD テスト表明・工数サマリ・リスク登録簿を追加） |
| 2026-05-31 | B-01 の citation を No.6229→**No.6225「地代、家賃や権利金、敷金など」**に訂正（レビューエージェントが提示した No.6229 は実際には「商品券やプリペイドカードなど」で別内容。国税庁ページを一次確認して訂正）。No.5408 従業員数要件を500人で一次確認 |
