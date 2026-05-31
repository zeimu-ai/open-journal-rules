import { describe, it, expect } from "vitest";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import usefulLife from "../rules/useful-life.json";
import usefulLifeSchema from "../schemas/useful-life.schema.json";
import rulesRaw from "../rules/journal-rules.json";

const rules = rulesRaw as unknown as Array<Record<string, unknown>>;
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

describe("Phase3D #27 法定耐用年数テーブル", () => {
  it("useful-life.json がスキーマに適合する", () => {
    const validate = ajv.compile(usefulLifeSchema);
    expect(validate(usefulLife), JSON.stringify(validate.errors)).toBe(true);
  });
  it("主要資産の耐用年数が国税庁表どおり(普通車6/軽4/PC4/金属机15)", () => {
    const find = (kw: string) =>
      (usefulLife as { assets: Array<{ item: string; usefulLifeYears: number }> }).assets.find((a) =>
        a.item.includes(kw),
      )?.usefulLifeYears;
    expect(find("普通自動車")).toBe(6);
    expect(find("軽自動車")).toBe(4);
    expect(find("パーソナルコンピュータ")).toBe(4);
    expect(find("主として金属製")).toBe(15);
  });
});

describe("Phase3D #39 リース料の根拠是正", () => {
  const r = rules.find((x) => x.id === "rule-30") as Record<string, unknown>;
  const cites = r.citations as Array<{ number: string; title: string }>;
  it("No.5704 のタイトルが『所有権移転外リース取引』に是正されている", () => {
    const c = cites.find((x) => x.number === "No.5704");
    expect(c?.title).toBe("所有権移転外リース取引");
  });
  it("No.5705(オペレーティングリース)が追加されている", () => {
    expect(cites.some((x) => x.number === "No.5705")).toBe(true);
  });
  it("notes に所有権移転外/オペレーティングの区分が明記されている", () => {
    const notes = String(r.notes);
    expect(notes).toContain("所有権移転外");
    expect(notes).toContain("オペレーティング");
  });
});
