import { describe, it, expect } from "vitest";
import rulesRaw from "../rules/journal-rules.json";
import accountsRaw from "../rules/account-master.json";
import { match, type MatchRule } from "../src/matcher";

const rules = rulesRaw as unknown as MatchRule[];
const accounts = accountsRaw as unknown as Array<Record<string, unknown>>;
const best = (d: string) => match(d, rules)[0]?.rule;
const acct = (n: string) => accounts.find((a) => a.name === n);

describe("#19 売上(収益)側のルール拡充", () => {
  it.each([
    ["事務所 家賃収入 5月分", "受取家賃", "課税売上10%"],
    ["店舗 賃料収入", "受取家賃", "課税売上10%"],
    ["住宅 家賃収入 アパート", "受取家賃", "非課税"],
    ["マンション 家賃収入", "受取家賃", "非課税"],
    ["仲介手数料 受取", "受取手数料", "課税売上10%"],
    ["手数料収入 管理", "受取手数料", "課税売上10%"],
  ])("%s → %s/%s", (desc, a, t) => {
    const r = best(desc);
    expect(r?.accountName).toBe(a);
    expect(r?.taxCategory).toBe(t);
  });

  it("受取家賃は事業用=課税売上10% / 住宅用=非課税 に区分される", () => {
    expect(best("事務所 家賃収入")?.taxCategory).toBe("課税売上10%");
    expect(best("住宅 家賃収入")?.taxCategory).toBe("非課税");
  });

  it("新規収益科目（受取家賃/受取手数料/売上値引）が追加されている", () => {
    expect(acct("受取家賃")?.category).toBe("income");
    expect(acct("受取手数料")?.taxDefault).toBe("課税売上10%");
    expect(acct("売上値引")?.category).toBe("income");
  });

  it("既存の売上値引/返品ルール(rule-46→売上高)は不変（退行ガード）", () => {
    expect(best("売上値引 5月")?.id).toBe("rule-46");
    expect(best("返品 処理")?.id).toBe("rule-46");
  });
});

describe("#31 B/S科目・純資産の整備", () => {
  it.each([
    ["建物 購入 事務所", "建物", "課税仕入10%"],
    ["機械装置 取得", "機械装置", "課税仕入10%"],
    ["社用車 購入", "車両運搬具", "課税仕入10%"],
    ["トラック 購入", "車両運搬具", "課税仕入10%"],
    ["国債 購入", "有価証券", "非課税"],
    ["株式 取得 投資", "有価証券", "非課税"],
    ["資本金 払込 増資", "資本金", "不課税"],
    ["繰越利益 振替", "繰越利益剰余金", "不課税"],
  ])("%s → %s/%s", (desc, a, t) => {
    const r = best(desc);
    expect(r?.accountName).toBe(a);
    expect(r?.taxCategory).toBe(t);
  });

  it("主要B/S科目（資産）が account-master に追加されている", () => {
    for (const n of ["現金", "当座預金", "定期預金", "受取手形", "有価証券", "棚卸資産", "前払金", "貸付金", "建物", "建物附属設備", "機械装置", "車両運搬具", "差入保証金"]) {
      expect(acct(n), `${n} が存在`).toBeTruthy();
      expect(acct(n)?.category).toBe("asset");
    }
    expect(acct("支払手形")?.category).toBe("liability");
  });

  it("純資産（株主資本）科目が追加され applicableEntity=corporation", () => {
    for (const n of ["資本金", "資本準備金", "利益準備金", "繰越利益剰余金", "自己株式"]) {
      expect(acct(n)?.category).toBe("equity");
      expect(acct(n)?.applicableEntity).toBe("corporation");
      expect(acct(n)?.taxDefault).toBe("不課税");
    }
  });

  it("固定資産取得は課税仕入10%・株式は非課税（消費税区分）", () => {
    expect(acct("建物")?.taxDefault).toBe("課税仕入10%");
    expect(acct("有価証券")?.taxDefault).toBe("非課税");
  });

  it("固定資産取得ルールは維持費（ガソリン・修繕）を奪わない（退行ガード）", () => {
    expect(best("車両 ガソリン代")?.accountName).toBe("車両費");
    expect(best("事務所家賃 ○○ビル")?.accountName).toBe("地代家賃"); // 支払家賃は受取家賃と区別
  });
});
