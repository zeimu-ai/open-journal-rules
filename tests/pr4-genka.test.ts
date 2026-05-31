import { describe, it, expect } from "vitest";
import rulesRaw from "../rules/journal-rules.json";
import accountsRaw from "../rules/account-master.json";
import costAccounting from "../rules/cost-accounting.json";
import { match, type MatchRule } from "../src/matcher";

const rules = rulesRaw as unknown as MatchRule[];
const accounts = accountsRaw as unknown as Array<Record<string, unknown>>;
const best = (d: string) => match(d, rules)[0]?.rule;
const acct = (n: string) => accounts.find((a) => a.name === n);

describe("#41 製造原価の体系", () => {
  it.each([
    ["工場賃金 5月", "労務費", "不課税"],
    ["製造部門給与", "労務費", "不課税"],
    ["仕掛品振替 期末", "仕掛品", "不課税"],
    ["製品製造原価 振替", "製品製造原価", "不課税"],
  ])("%s → %s/%s", (desc, a, t) => {
    const r = best(desc);
    expect(r?.accountName).toBe(a);
    expect(r?.taxCategory).toBe(t);
  });

  it("製造原価科目（労務費/仕掛品/半製品/製品製造原価）が追加されている", () => {
    expect(acct("労務費")?.category).toBe("expense");
    expect(acct("仕掛品")?.category).toBe("asset");
    expect(acct("半製品")?.category).toBe("asset");
    expect(acct("製品製造原価")?.category).toBe("expense");
  });

  it("労務費（製造現場の賃金）は不課税・材料費は課税仕入10%", () => {
    expect(acct("労務費")?.taxDefault).toBe("不課税");
    expect(best("工事材料費 鉄骨")?.taxCategory).toBe("課税仕入10%");
  });

  it("原価区分の構造（材料費/労務費/製造経費）が cost-accounting に定義されている", () => {
    const cats = costAccounting.manufacturingCost.structure.map((s) => s.costCategory);
    expect(cats).toEqual(["材料費", "労務費", "製造経費"]);
  });
});

describe("#41 建設業の完成工事原価", () => {
  it.each([
    ["完成工事原価振替", "完成工事原価", "不課税"],
    ["工事原価振替 完成", "完成工事原価", "不課税"],
    ["現場賃金 5月", "労務費", "不課税"],
    ["工事材料費 鉄骨", "材料費", "課税仕入10%"],
  ])("%s → %s/%s", (desc, a, t) => {
    const r = best(desc);
    expect(r?.accountName).toBe(a);
    expect(r?.taxCategory).toBe(t);
  });

  it("完成工事原価科目が追加されている（法人税法22条3項1号）", () => {
    expect(acct("完成工事原価")?.category).toBe("expense");
    expect(acct("完成工事原価")?.taxDefault).toBe("不課税");
  });

  it("完成工事原価の4区分（材料費/労務費/外注費/経費）が定義されている", () => {
    const cats = costAccounting.constructionCost.structure.map((s) => s.costCategory);
    expect(cats).toEqual(["材料費", "労務費", "外注費", "経費"]);
  });

  it("既存の製造業仕入ルールは不変（退行ガード）", () => {
    expect(best("原材料 仕入")?.accountName).toBe("仕入高");
    expect(best("外注加工 委託")?.accountName).toBe("外注工賃");
  });
});
