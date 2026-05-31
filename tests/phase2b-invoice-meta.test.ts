import { describe, it, expect } from "vitest";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import simplifiedRates from "../rules/simplified-tax-rates.json";
import simplifiedSchema from "../schemas/simplified-tax-rate.schema.json";
import invoiceTransitional from "../rules/invoice-transitional.json";
import invoiceSchema from "../schemas/invoice-transitional.schema.json";
import ruleSchema from "../schemas/journal-rule.schema.json";
import rulesRaw from "../rules/journal-rules.json";

const rules = rulesRaw as unknown as Array<Record<string, unknown>>;
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

describe("Phase2B #24 簡易課税みなし仕入率", () => {
  it("simplified-tax-rates.json がスキーマに適合する", () => {
    const validate = ajv.compile(simplifiedSchema);
    expect(validate(simplifiedRates), JSON.stringify(validate.errors)).toBe(true);
  });
  it("6事業区分のみなし仕入率が 90/80/70/60/50/40% である", () => {
    const rates = (simplifiedRates as { businessTypes: Array<{ type: string; deemedPurchaseRate: number }> })
      .businessTypes;
    expect(rates.map((b) => b.deemedPurchaseRate)).toEqual([0.9, 0.8, 0.7, 0.6, 0.5, 0.4]);
    expect((simplifiedRates as { citation: { number: string } }).citation.number).toBe("No.6505");
  });
});

describe("Phase2B #24 インボイス経過措置", () => {
  it("invoice-transitional.json がスキーマに適合する", () => {
    const validate = ajv.compile(invoiceSchema);
    expect(validate(invoiceTransitional), JSON.stringify(validate.errors)).toBe(true);
  });
  it("80%(2023-10〜2026-09) と 50%(2026-10〜2029-09) の経過措置が定義されている", () => {
    const t = (invoiceTransitional as { transitionalDeduction: Array<{ rate: number; from: string; to: string }> })
      .transitionalDeduction;
    expect(t).toEqual([
      { rate: 0.8, from: "2023-10-01", to: "2026-09-30", note: expect.any(String) },
      { rate: 0.5, from: "2026-10-01", to: "2029-09-30", note: expect.any(String) },
    ]);
  });
});

describe("Phase2B #23/#25 スキーマ拡張", () => {
  const validate = ajv.compile(ruleSchema);
  it("purposeCategory(用途区分) を任意フィールドとして受理する", () => {
    const sample = { ...(rules.find((r) => r.id === "rule-01") as object), purposeCategory: "common" };
    expect(validate(sample), JSON.stringify(validate.errors)).toBe(true);
  });
  it("不正な purposeCategory は拒否する", () => {
    const bad = { ...(rules.find((r) => r.id === "rule-01") as object), purposeCategory: "invalid" };
    expect(validate(bad)).toBe(false);
  });
  it("rule-05(クラウドSaaS)に reverseChargeApplicable=true が付与されている", () => {
    const r = rules.find((x) => x.id === "rule-05");
    expect(r?.reverseChargeApplicable).toBe(true);
  });
});
