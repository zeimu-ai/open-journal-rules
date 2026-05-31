import { describe, it, expect } from "vitest";
import Ajv from "ajv";
import rulesRaw from "../rules/journal-rules.json";
import accountsRaw from "../rules/account-master.json";
import datasetMeta from "../rules/dataset-meta.json";
import datasetMetaSchema from "../schemas/dataset-meta.schema.json";
import { match, type MatchRule } from "../src/matcher";
import { getApplicableEntity, appliesToEntity } from "../src/entity";

const rules = rulesRaw as unknown as Array<Record<string, unknown>>;
const accounts = accountsRaw as unknown as Array<Record<string, unknown>>;
const ENTITIES = ["individual", "corporation", "both"];

/**
 * Phase 0 / #13(C-1 適用主体) ・ #14(G-5 課税方式・適用年度メタ) のテスト。
 */
describe("applicableEntity メタ (#13 適用主体)", () => {
  it("全ルールが有効な applicableEntity を持つこと", () => {
    for (const r of rules) {
      expect(ENTITIES, `${r.id as string}`).toContain(r.applicableEntity);
    }
  });

  it("全科目が有効な applicableEntity を持つこと", () => {
    for (const a of accounts) {
      expect(ENTITIES, `${a.id as number}`).toContain(a.applicableEntity);
    }
  });

  it("役員報酬(rule-20 / account id=62)は corporation であること", () => {
    expect(rules.find((r) => r.id === "rule-20")?.applicableEntity).toBe("corporation");
    expect(accounts.find((a) => a.id === 62)?.applicableEntity).toBe("corporation");
  });

  it("corporation 指定の科目は個人様式『青色申告決算書』を典拠にしないこと(主体↔典拠の整合回帰)", () => {
    for (const a of accounts) {
      if (a.applicableEntity !== "corporation") continue;
      const nums = ((a.citations as Array<{ number?: string }>) ?? [])
        .map((c) => c.number ?? "")
        .join(",");
      expect(nums, `${a.id as number} ${a.name as string}`).not.toContain("青色申告決算書");
    }
  });
});

describe("applicableYear メタ (#14 適用年度)", () => {
  it("経過措置ルール(rule-15 / rule-18)に適用期間が付与されていること", () => {
    for (const id of ["rule-15", "rule-18"]) {
      const r = rules.find((x) => x.id === id) as Record<string, unknown>;
      const ay = r.applicableYear as { from?: string; to?: string } | undefined;
      expect(ay, id).toBeDefined();
      expect(ay?.from).toBe("2023-10");
      expect(ay?.to).toBe("2026-09");
    }
  });
});

describe("dataset-meta (#14 課税方式メタ)", () => {
  it("対象主体・課税方式メタが宣言されていること", () => {
    const m = datasetMeta as Record<string, unknown>;
    expect(m.targetEntity).toBe("both");
    expect(m.applicableTaxMethods).toContain("原則課税");
    expect(m.defaultTaxMethod).toBe("原則課税");
  });

  it("dataset-meta.json が dataset-meta.schema.json に適合すること", () => {
    const ajv = new Ajv({ allErrors: true });
    const validate = ajv.compile(datasetMetaSchema);
    const valid = validate(datasetMeta);
    if (!valid) {
      expect.fail(
        `dataset-meta スキーマ違反: ${validate.errors?.map((e) => `${e.instancePath} ${e.message}`).join(", ")}`,
      );
    }
  });
});

describe("entity ヘルパ + matcher の entity フィルタ", () => {
  it("getApplicableEntity は欠損/不正値を both とみなすこと", () => {
    expect(getApplicableEntity({})).toBe("both");
    expect(getApplicableEntity({ applicableEntity: "corporation" })).toBe("corporation");
    expect(getApplicableEntity({ applicableEntity: "個人" })).toBe("both");
  });

  it("appliesToEntity: both は両主体に適用、専用は当該主体のみ", () => {
    expect(appliesToEntity({ applicableEntity: "both" }, "individual")).toBe(true);
    expect(appliesToEntity({ applicableEntity: "both" }, "corporation")).toBe(true);
    expect(appliesToEntity({ applicableEntity: "corporation" }, "individual")).toBe(false);
    expect(appliesToEntity({ applicableEntity: "corporation" }, "corporation")).toBe(true);
    // 対称ケース: 個人専用ルールは法人から除外される(将来 individual 専用ルール追加時の回帰ガード)
    expect(appliesToEntity({ applicableEntity: "individual" }, "corporation")).toBe(false);
    expect(appliesToEntity({ applicableEntity: "individual" }, "individual")).toBe(true);
  });

  it("matcher は entity 指定で corporation 専用ルールを個人から除外すること", () => {
    const all = rules as unknown as MatchRule[];
    const forIndividual = match("役員報酬の支払 50000", all, "individual");
    expect(forIndividual.find((r) => r.rule.id === "rule-20")).toBeUndefined();

    const forCorporation = match("役員報酬の支払 50000", all, "corporation");
    expect(forCorporation.find((r) => r.rule.id === "rule-20")).toBeDefined();
  });

  it("entity 未指定なら従来通り全ルールが対象(後方互換)", () => {
    const all = rules as unknown as MatchRule[];
    const res = match("役員報酬の支払 50000", all);
    expect(res.find((r) => r.rule.id === "rule-20")).toBeDefined();
  });
});
