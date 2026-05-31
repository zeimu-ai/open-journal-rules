import { describe, it, expect } from "vitest";
import rules from "../rules/journal-rules.json";
import mapping from "../rules/citation-mapping.json";
import accounts from "../rules/account-master.json";

const TARGET_RULES = [
  "rule-01", "rule-02", "rule-04", "rule-05", "rule-07", "rule-08",
  "rule-09", "rule-13", "rule-15", "rule-18", "rule-28", "rule-29",
];

const get = (id: string) => rules.find((r) => r.id === id);

describe("#47/#36 No.2210 catch-all を法令(所得税法37条1項)へ格上げ", () => {
  it.each(TARGET_RULES)(
    "%s の citations[0] が 所得税法第37条第1項(statute)",
    (id) => {
      const r = get(id);
      expect(r?.citations?.[0]?.number).toBe("所得税法第37条第1項");
      expect(r?.citations?.[0]?.authority_level).toBe("statute");
    },
  );

  it("対象12ルールの citations[0] に No.2210 が残っていない(catch-all降格)", () => {
    const stillPrimary = TARGET_RULES.filter(
      (id) => get(id)?.citations?.[0]?.number === "No.2210",
    );
    expect(stillPrimary).toEqual([]);
  });

  it("No.2210 は削除されず補助根拠として保持される", () => {
    for (const id of TARGET_RULES) {
      const nums = (get(id)?.citations ?? []).map((c) => c.number);
      expect(nums, id).toContain("No.2210");
    }
  });

  it.each(TARGET_RULES)(
    "%s の accountName が citation-mapping に 所得税法第37条第1項 を含む",
    (id) => {
      const r = get(id);
      const m = (mapping as Record<string, { expectedNumbers: string[] }>)[
        r!.accountName
      ];
      expect(m, r!.accountName).toBeDefined();
      expect(m.expectedNumbers).toContain("所得税法第37条第1項");
    },
  );

  it("statute citation を持つルールが12件以上に底上げされている", () => {
    const n = rules.filter((r) =>
      (r.citations ?? []).some((c) => c.authority_level === "statute"),
    ).length;
    expect(n).toBeGreaterThanOrEqual(12);
  });
});

describe("#29 繰延資産6号系(公共的施設等/建物賃借/ノウハウ)を追加", () => {
  const find = (n: string) => accounts.find((a) => a.name === n);
  const cases: [string, string][] = [
    ["公共的施設等負担金", "第14条第1項第6号イ"],
    ["建物賃借権利金", "第14条第1項第6号ロ"],
    ["ノウハウ役務提供権利金", "第14条第1項第6号ハ"],
  ];

  it.each(cases)(
    "%s が asset/不課税/corporation で存在し6号該当条文(%s)を持つ",
    (name, num) => {
      const a = find(name);
      expect(a, name).toBeDefined();
      expect(a?.category).toBe("asset");
      expect(a?.taxDefault).toBe("不課税");
      expect(a?.applicableEntity).toBe("corporation");
      const nums = (a?.citations ?? []).map((c) => c.number);
      expect(nums).toContain(num);
    },
  );

  it("6号系3科目は均等償却(令64条1項2号)と法基通8-2-3を典拠に持つ", () => {
    for (const [name] of cases) {
      const a = find(name);
      const nums = (a?.citations ?? []).map((c) => c.number);
      expect(nums, name).toContain("第64条第1項第2号");
      expect(nums, name).toContain("8-2-3");
      expect(a?.description).toMatch(/均等償却/);
    }
  });
});
