import { describe, it, expect } from "vitest";
import rulesRaw from "../rules/journal-rules.json";
import accountsRaw from "../rules/account-master.json";
import { match, type MatchRule } from "../src/matcher";

const rules = rulesRaw as unknown as MatchRule[];
const accounts = accountsRaw as unknown as Array<Record<string, unknown>>;
const best = (d: string) => match(d, rules)[0]?.rule;

describe("消費税拡充 B: 非課税網羅(通達)", () => {
  it.each([
    ["分娩 入院費", "助産費", "非課税"],
    ["火葬料 斎場", "埋葬費", "非課税"],
    ["車椅子 購入 身体障害者用", "消耗品費", "非課税"],
  ])("%s → %s/%s", (desc, acct, tax) => {
    const r = best(desc);
    expect(r?.accountName).toBe(acct);
    expect(r?.taxCategory).toBe(tax);
  });
});

describe("消費税拡充 C: 不課税(会費・負担金 通達)", () => {
  it("協会入会金は 諸会費/不課税 (5-5-4)", () => {
    const r = best("協会入会金 支払");
    expect(r?.accountName).toBe("諸会費");
    expect(r?.taxCategory).toBe("不課税");
    expect((r?.citations as Array<{ number: string }>)[0].number).toBe("5-5-4");
  });
});

describe("消費税拡充 A: 軽減税率8%の境界", () => {
  it("一体資産は 8%", () => {
    expect(best("おまけ付き食品 仕入")?.taxCategory).toBe("課税仕入8%（軽減税率）");
  });
  it("医薬品は 10%(食品でない)", () => {
    expect(best("医薬品 仕入")?.taxCategory).toBe("課税仕入10%");
  });
  it("酒類は 10%(飲食料品から除外)", () => {
    expect(best("ビール仕入 ケース")?.taxCategory).toBe("課税仕入10%");
  });
});

describe("消費税拡充: 既存ルールへの通達根拠付与", () => {
  it("rule-44(損害賠償)に 5-2-5 が追加されている", () => {
    const r = rules.find((x) => x.id === "rule-44") as Record<string, unknown>;
    expect((r.citations as Array<{ number: string }>).map((c) => c.number)).toContain("5-2-5");
  });
  it("rule-17(諸会費)に 5-5-3 が追加されている", () => {
    const r = rules.find((x) => x.id === "rule-17") as Record<string, unknown>;
    expect((r.citations as Array<{ number: string }>).map((c) => c.number)).toContain("5-5-3");
  });
  it("rule-38(住宅家賃)notesに共益費(6-13-9)が明記されている", () => {
    const r = rules.find((x) => x.id === "rule-38") as Record<string, unknown>;
    expect(String(r.notes)).toContain("6-13-9");
  });
  it("助産費・埋葬費 科目が追加されている", () => {
    expect(accounts.find((a) => a.name === "助産費")?.taxDefault).toBe("非課税");
    expect(accounts.find((a) => a.name === "埋葬費")?.taxDefault).toBe("非課税");
  });
});
