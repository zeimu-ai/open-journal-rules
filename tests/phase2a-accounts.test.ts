import { describe, it, expect } from "vitest";
import accountsRaw from "../rules/account-master.json";
import rulesRaw from "../rules/journal-rules.json";
import { match, type MatchRule } from "../src/matcher";

const accounts = accountsRaw as unknown as Array<Record<string, unknown>>;
const rules = rulesRaw as unknown as MatchRule[];
const get = (name: string) => accounts.find((a) => a.name === name);
const best = (d: string) => match(d, rules)[0]?.rule;

describe("Phase2A #31 B/S・純資産科目", () => {
  it.each([
    ["買掛金", "liability", "不課税", "both"],
    ["前受金", "liability", "不課税", "both"],
    ["元入金", "equity", "不課税", "individual"],
    ["事業主貸", "asset", "不課税", "individual"],
    ["事業主借", "equity", "不課税", "individual"],
  ])("%s が追加されている(category=%s, taxDefault=%s, entity=%s)", (name, cat, tax, ent) => {
    const a = get(name);
    expect(a, name).toBeDefined();
    expect(a?.category).toBe(cat);
    expect(a?.taxDefault).toBe(tax);
    expect(a?.applicableEntity).toBe(ent);
  });

  it("純資産科目に category=equity が使われている", () => {
    expect(accounts.some((a) => a.category === "equity")).toBe(true);
  });
});

describe("Phase2A #30 個人事業特有", () => {
  it("専従者給与 科目が追加されている(individual, 不課税)", () => {
    const a = get("専従者給与");
    expect(a).toBeDefined();
    expect(a?.applicableEntity).toBe("individual");
    expect(a?.taxDefault).toBe("不課税");
  });
  it("専従者給与は No.2075 を典拠にしている", () => {
    const a = get("専従者給与") as Record<string, unknown>;
    const nums = (a.citations as Array<{ number?: string }>).map((c) => c.number);
    expect(nums).toContain("No.2075");
  });
  it.each([
    ["専従者給与 4月分", "専従者給与"],
    ["事業主貸 生活費", "事業主貸"],
    ["事業主借 私費補填", "事業主借"],
    ["買掛金 仕入", "買掛金"],
    ["前受金 手付", "前受金"],
  ])("%s → %s", (desc, acct) => {
    expect(best(desc)?.accountName).toBe(acct);
  });
});

describe("Phase2A #29 ソフトウェア citation 強化", () => {
  it("ソフトウェア科目に No.5461(耐用年数) が追加されている", () => {
    const a = get("ソフトウェア") as Record<string, unknown>;
    const nums = (a.citations as Array<{ number?: string }>).map((c) => c.number);
    expect(nums).toContain("No.5461");
  });
});
