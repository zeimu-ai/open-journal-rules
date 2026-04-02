# 根拠URL一覧

> このファイルは `npx tsx scripts/generate-sources.ts` で自動生成されています。
> 手動で編集しないでください。

全ルールは国税庁等の公式ドキュメントに基づいています。

## 根拠一覧

| # | 出典 | 番号 | タイトル | URL | 使用箇所数 |
|---|------|------|---------|-----|:----------:|
| 1 | 国税庁 | 青色申告決算書 | 必要経費の科目一覧 | [リンク](https://www.keisan.nta.go.jp/r5yokuaru/aoiroshinkoku/hitsuyokeihi/index.html) | 39 |
| 2 | 国税庁タックスアンサー | No.5403 | 少額の減価償却資産の取得価額の損金算入 | [リンク](https://www.nta.go.jp/taxes/shiraberu/taxanswer/hojin/5403.htm) | 5 |
| 3 | 国税庁タックスアンサー | No.6201 | 非課税となる取引 | [リンク](https://www.nta.go.jp/taxes/shiraberu/taxanswer/shohi/6201.htm) | 6 |
| 4 | 国税庁タックスアンサー | No.6209 | 非課税と不課税の違い | [リンク](https://www.nta.go.jp/taxes/shiraberu/taxanswer/shohi/6209.htm) | 7 |
| 5 | 国税庁タックスアンサー | No.2200 | 収入金額とその計算 | [リンク](https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/2200.htm) | 1 |
| 6 | 国税庁タックスアンサー | 帳簿の記帳 | 個人で事業を行っている方の記帳・帳簿等の保存について | [リンク](https://www.nta.go.jp/taxes/shiraberu/shinkoku/kojin_jigyo/index.htm) | 1 |
| 7 | 国税庁タックスアンサー | No.2210 | やさしい必要経費の知識 | [リンク](https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/2210.htm) | 2 |
| 8 | 国税庁タックスアンサー | No.5704 | リース取引についての消費税の取扱い | [リンク](https://www.nta.go.jp/taxes/shiraberu/taxanswer/hojin/5704.htm) | 2 |
| 9 | 国税庁タックスアンサー | No.2523 | 賞与に対する源泉徴収 | [リンク](https://www.nta.go.jp/taxes/shiraberu/taxanswer/gensen/2523.htm) | 2 |
| 10 | 国税庁タックスアンサー | No.5402 | 修繕費とならないものの判定 | [リンク](https://www.nta.go.jp/taxes/shiraberu/taxanswer/hojin/5402.htm) | 3 |
| 11 | 国税庁 |  |  | [リンク](https://www.nta.go.jp/taxes/shiraberu/taxanswer/hojin/5408.htm) | 1 |
| 12 | 国税庁 |  |  | [リンク](https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/2100.htm) | 2 |

## 使用箇所の詳細

### 青色申告決算書: 必要経費の科目一覧

- ルール: 通信費 (rule-01)
- ルール: 水道光熱費 (rule-02)
- ルール: 旅費交通費 (rule-04)
- ルール: クラウドSaaS (rule-05)
- ルール: 荷造運賃 (rule-07)
- ルール: 広告宣伝費 (rule-08)
- ルール: 振込手数料 (rule-09)
- ルール: 書籍・図書 (rule-13)
- ルール: 研修費 (rule-14)
- ルール: 税理士等報酬 (rule-15)
- ルール: 文具・消耗品 (rule-16)
- ルール: 会費 (rule-17)
- ルール: 外注費 (rule-18)
- ルール: 会議費 (rule-25)
- ルール: 接待交際費 (rule-26)
- ルール: 売上高（直接入金） (rule-27)
- ルール: 仕入高 (rule-28)
- 科目: 売上高
- 科目: 租税公課
- 科目: 荷造運賃
- 科目: 水道光熱費
- 科目: 旅費交通費
- 科目: 通信費
- 科目: 広告宣伝費
- 科目: 接待交際費
- 科目: 修繕費
- 科目: 減価償却費
- 科目: 福利厚生費
- 科目: 給料賃金
- 科目: 外注工賃
- 科目: 貸倒金
- 科目: 支払報酬
- 科目: 新聞図書費
- 科目: 研修費
- 科目: 支払手数料
- 科目: 諸会費
- 科目: 普通預金
- 科目: 売掛金
- 科目: 短期借入金

### No.5403: 少額の減価償却資産の取得価額の損金算入

- ルール: 消耗品費（EC） (rule-03)
- 科目: 消耗品費
- 科目: 工具器具備品
- 閾値: 全額経費（消耗品費） (threshold-01)
- 閾値: 一括償却資産（3年均等償却） (threshold-02)

### No.6201: 非課税となる取引

- ルール: 地代家賃 (rule-06)
- ルール: 保険料 (rule-10)
- ルール: 利子割引料 (rule-33)
- 科目: 損害保険料
- 科目: 利子割引料
- 科目: 地代家賃

### No.6209: 非課税と不課税の違い

- ルール: 社会保険料 (rule-11)
- ルール: 租税公課 (rule-12)
- ルール: 給料手当 (rule-19)
- ルール: 役員報酬 (rule-20)
- ルール: 法定福利費（社保会社負担） (rule-21)
- ルール: 預り金（源泉税） (rule-22)
- 科目: 法定福利費

### No.2200: 収入金額とその計算

- ルール: 売掛金回収 (rule-23)

### 帳簿の記帳: 個人で事業を行っている方の記帳・帳簿等の保存について

- ルール: 未払金精算（クレカ引落） (rule-24)

### No.2210: やさしい必要経費の知識

- ルール: 車両費 (rule-29)
- 科目: 車両費

### No.5704: リース取引についての消費税の取扱い

- ルール: リース料 (rule-30)
- 科目: リース料

### No.2523: 賞与に対する源泉徴収

- ルール: 賞与 (rule-31)
- 科目: 賞与

### No.5402: 修繕費とならないものの判定

- ルール: 修繕費 (rule-32)
- 閾値: 修繕費（周期基準・少額基準） (threshold-06)
- 閾値: 修繕費（不明瞭でも可） (threshold-07)

### 国税庁: https://www.nta.go.jp/taxes/shiraberu/taxanswer/hojin/5408.htm

- 閾値: 少額減価償却資産特例（青色申告者・年間300万円上限） (threshold-03)

### 国税庁: https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/2100.htm

- 閾値: 固定資産として減価償却（法定耐用年数に従う） (threshold-04)
- 閾値: 強制要判断（高額取引リスク管理） (threshold-05)

---

*最終生成: 2026-04-02*
