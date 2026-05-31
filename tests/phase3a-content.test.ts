import { describe, it, expect } from "vitest";
import rulesRaw from "../rules/journal-rules.json";
import accountsRaw from "../rules/account-master.json";
import { match, type MatchRule } from "../src/matcher";

const rules = rulesRaw as unknown as MatchRule[];
const accounts = accountsRaw as unknown as Array<Record<string, unknown>>;
const best = (d: string) => match(d, rules)[0]?.rule;

describe("Phase3A #38 輸出免税", () => {
  it("輸出売上は 売上高 / 免税", () => {
    const r = best("輸出売上 米国向け");
    expect(r?.accountName).toBe("売上高");
    expect(r?.taxCategory).toBe("免税");
  });
});

describe("Phase3A #40 寄附金・貸倒・引当金", () => {
  it("寄附金は 寄附金 / 不課税 (No.5281)", () => {
    const r = best("寄附金 日本赤十字");
    expect(r?.accountName).toBe("寄附金");
    expect(r?.taxCategory).toBe("不課税");
    expect((r?.citations as Array<{ number: string }>)[0].number).toBe("No.5281");
  });
  it("貸倒損失は 貸倒金 / 不課税 (No.5320)", () => {
    const r = best("貸倒損失 A社 回収不能");
    expect(r?.accountName).toBe("貸倒金");
    expect((r?.citations as Array<{ number: string }>)[0].number).toBe("No.5320");
  });
  it("貸倒引当金繰入は P/L費用科目 貸倒引当金繰入額 (No.5501)", () => {
    const r = best("貸倒引当金 繰入");
    expect(r?.accountName).toBe("貸倒引当金繰入額");
  });
  it("受取側の『寄附金収入』は雑収入のまま(支払側ルールに奪われない)", () => {
    expect(best("寄附金収入 入金")?.accountName).toBe("雑収入");
  });
  it("寄附金・貸倒引当金繰入額・貸倒引当金 科目が追加されている", () => {
    expect(accounts.find((a) => a.name === "寄附金")?.category).toBe("expense");
    expect(accounts.find((a) => a.name === "貸倒引当金繰入額")?.category).toBe("expense");
    // 貸倒引当金は評価性引当金=資産のマイナス(contra-asset)として asset 分類
    expect(accounts.find((a) => a.name === "貸倒引当金")?.category).toBe("asset");
  });
});

describe("Phase3A #42 印紙税", () => {
  it("収入印紙は 租税公課 / 不課税 (No.7141)", () => {
    const r = best("収入印紙 200円");
    expect(r?.accountName).toBe("租税公課");
    expect(r?.taxCategory).toBe("不課税");
    expect((r?.citations as Array<{ number: string }>)[0].number).toBe("No.7141");
  });
});
