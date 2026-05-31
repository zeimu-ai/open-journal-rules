import { describe, it, expect } from "vitest";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import rulesRaw from "../rules/journal-rules.json";
import accountsRaw from "../rules/account-master.json";
import invoiceTransitional from "../rules/invoice-transitional.json";
import invoiceSchema from "../schemas/invoice-transitional.schema.json";
import { match, type MatchRule } from "../src/matcher";

const rules = rulesRaw as unknown as MatchRule[];
const accounts = accountsRaw as unknown as Array<Record<string, unknown>>;
const best = (d: string) => match(d, rules)[0]?.rule;

describe("Phase3E #19 固定資産売却", () => {
  it("固定資産売却は 固定資産売却損益 / 課税売上10%", () => {
    const r = best("車両売却 下取り");
    expect(r?.accountName).toBe("固定資産売却損益");
    expect(r?.taxCategory).toBe("課税売上10%");
    expect((r?.citations as Array<{ number: string }>).map((c) => c.number)).toContain("No.6105");
  });
});

describe("Phase3E #16 有価証券譲渡", () => {
  it("有価証券譲渡は 有価証券売却損益 / 非課税(5%算入のNo.6405を併記)", () => {
    const r = best("株式売却 取引");
    expect(r?.accountName).toBe("有価証券売却損益");
    expect(r?.taxCategory).toBe("非課税");
    const nums = (r?.citations as Array<{ number: string }>).map((c) => c.number);
    expect(nums).toContain("No.6201");
    expect(nums).toContain("No.6405");
  });
  it("新規収益科目が追加されている", () => {
    expect(accounts.find((a) => a.name === "固定資産売却損益")?.taxDefault).toBe("課税売上10%");
    expect(accounts.find((a) => a.name === "有価証券売却損益")?.taxDefault).toBe("非課税");
  });
});

describe("Phase3E #24 2割特例・少額特例", () => {
  const ajv = new Ajv({ allErrors: true });
  addFormats(ajv);
  it("invoice-transitional.json がスキーマに適合する(新フィールド含む)", () => {
    const validate = ajv.compile(invoiceSchema);
    expect(validate(invoiceTransitional), JSON.stringify(validate.errors)).toBe(true);
  });
  it("2割特例(80%控除・〜2026-09-30)が定義されている", () => {
    const t = (invoiceTransitional as { twoRatioSpecial: { deductionRatio: number; applicablePeriod: { to: string } } })
      .twoRatioSpecial;
    expect(t.deductionRatio).toBe(0.8);
    expect(t.applicablePeriod.to).toBe("2026-09-30");
  });
  it("少額特例(税込1万円未満・〜2029-09-30・No.6496)が定義されている", () => {
    const s = (invoiceTransitional as {
      smallAmountException: { thresholdYen: number; applicablePeriod: { to: string }; citation: { number: string } };
    }).smallAmountException;
    expect(s.thresholdYen).toBe(10000);
    expect(s.applicablePeriod.to).toBe("2029-09-30");
    expect(s.citation.number).toBe("No.6496");
  });
});
