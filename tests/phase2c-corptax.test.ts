import { describe, it, expect } from "vitest";
import rulesRaw from "../rules/journal-rules.json";

const rules = rulesRaw as unknown as Array<Record<string, unknown>>;
const get = (id: string) => rules.find((r) => r.id === id) as Record<string, unknown>;

describe("Phase2C #26 役員給与の損金不算入", () => {
  it("rule-20(役員報酬)の notes に損金算入3類型が明記されている", () => {
    const notes = String(get("rule-20").notes);
    for (const t of ["定期同額給与", "事前確定届出給与", "業績連動給与"]) {
      expect(notes, t).toContain(t);
    }
    expect(notes).toContain("法人税法34");
  });
});

describe("Phase2C #28 修繕費 vs 資本的支出", () => {
  it("rule-32(修繕費)の notes に形式基準(20万/60万/30%ルール)と実質基準が明記されている", () => {
    const notes = String(get("rule-32").notes);
    expect(notes).toContain("20万円");
    expect(notes).toContain("60万円");
    expect(notes).toContain("資本的支出");
    expect(notes).toContain("No.5402");
  });
});
