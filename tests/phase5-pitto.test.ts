import { describe, it, expect } from "vitest";
import rulesRaw from "../rules/journal-rules.json";
import accountsRaw from "../rules/account-master.json";
import thresholdsRaw from "../rules/amount-thresholds.json";
import {
  isInvoiceRegistrationNumberFormat,
  extractInvoiceRegistrationNumbers,
  isValidCorporateNumber,
  validateInvoiceRegistrationNumber,
} from "../src/invoice-number";

const rules = rulesRaw as unknown as Array<Record<string, unknown>>;
const accounts = accountsRaw as unknown as Array<Record<string, unknown>>;
const thresholds = thresholdsRaw as unknown as Array<Record<string, unknown>>;

describe("#20 外注費 vs 給与の判定", () => {
  it("rule-18 に消基通1-1-1の判定4要素が notes/citation で付与されている", () => {
    const r = rules.find((x) => x.id === "rule-18") as Record<string, unknown>;
    const notes = String(r.notes);
    expect(notes).toContain("代替");
    expect(notes).toContain("指揮監督");
    expect(notes).toContain("危険負担");
    expect(notes).toContain("材料");
    expect((r.citations as Array<{ number: string }>).map((c) => c.number)).toContain("1-1-1");
  });
});

describe("pitto: amount-thresholds の accountName 汎用化", () => {
  it("asset_acquisition 閾値に accountName=[消耗品費] が付与されている", () => {
    const t = thresholds.find((x) => x.category === "asset_acquisition") as Record<string, unknown>;
    expect(t.accountName).toEqual(["消耗品費"]);
  });
  it("repair/meeting 閾値にも accountName が付与されている", () => {
    expect((thresholds.find((x) => x.category === "repair") as Record<string, unknown>).accountName).toEqual([
      "修繕費",
    ]);
    expect((thresholds.find((x) => x.category === "meeting") as Record<string, unknown>).accountName).toEqual([
      "会議費",
    ]);
  });
});

describe("pitto: 源泉徴収フラグ", () => {
  it("支払報酬に withholdingRequired=true が付与されている", () => {
    expect(accounts.find((a) => a.name === "支払報酬")?.withholdingRequired).toBe(true);
  });
});

describe("pitto: 適格請求書登録番号(T+13桁)ユーティリティ", () => {
  it("形式判定", () => {
    expect(isInvoiceRegistrationNumberFormat("T7000012050002")).toBe(true);
    expect(isInvoiceRegistrationNumberFormat("7000012050002")).toBe(false);
    expect(isInvoiceRegistrationNumberFormat("T70000120500")).toBe(false);
  });
  it("OCRテキストから抽出(重複除去)", () => {
    expect(extractInvoiceRegistrationNumbers("登録番号 T7000012050002 です。再掲 T7000012050002")).toEqual([
      "T7000012050002",
    ]);
  });
  it("T+14桁等の数字列からは誤抽出しない / 非数字に囲まれた登録番号は抽出する", () => {
    expect(extractInvoiceRegistrationNumbers("T70000120500023")).toEqual([]); // T+14桁
    expect(extractInvoiceRegistrationNumbers("9T7000012050002")).toEqual([]); // 直前が数字
    expect(extractInvoiceRegistrationNumbers("登録番号:T7000012050002 当社")).toEqual(["T7000012050002"]);
  });
  it("法人番号の検査用数字を検証(国税庁 7000012050002 は有効)", () => {
    expect(isValidCorporateNumber("7000012050002")).toBe(true);
    expect(isValidCorporateNumber("7000012050003")).toBe(false); // 1桁改変→不整合
  });
  it("登録番号の総合検証", () => {
    const v = validateInvoiceRegistrationNumber(" T7000012050002 ");
    expect(v.formatValid).toBe(true);
    expect(v.number).toBe("T7000012050002");
    expect(v.corporateCheckDigitValid).toBe(true);
    expect(validateInvoiceRegistrationNumber("invalid").formatValid).toBe(false);
  });
});
