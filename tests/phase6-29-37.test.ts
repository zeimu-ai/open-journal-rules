import { describe, it, expect } from "vitest";
import accounts from "../rules/account-master.json";
import rules from "../rules/journal-rules.json";

describe("#29 繰延資産 account 追加", () => {
  const find = (n: string) => accounts.find((a) => a.name === n);

  // [科目名, applicableEntity, 法人税法施行令の条番号]
  const cases: [string, string, string][] = [
    ["創立費", "corporation", "第14条第1項第1号"],
    ["開業費", "both", "第14条第1項第2号"],
    ["開発費", "both", "第14条第1項第3号"],
    ["株式交付費", "corporation", "第14条第1項第4号"],
    ["社債等発行費", "corporation", "第14条第1項第5号"],
  ];

  it.each(cases)(
    "%s が category=asset / taxDefault=不課税 / applicableEntity 一致 で存在する",
    (name, ent) => {
      const a = find(name);
      expect(a, name).toBeDefined();
      expect(a?.category).toBe("asset");
      expect(a?.taxDefault).toBe("不課税");
      expect(a?.applicableEntity).toBe(ent);
    },
  );

  it.each(cases)(
    "%s は法人税法施行令の条番号を citations に持つ",
    (name, _ent, num) => {
      const a = find(name);
      const nums = (a?.citations ?? []).map((c) => c.number);
      expect(nums).toContain(num);
    },
  );

  it("繰延資産5科目の全 citations が authority_level/url(https)/verified_at を持つ", () => {
    for (const [name] of cases) {
      const a = find(name);
      expect(a?.citations?.length, `${name} citations`).toBeGreaterThan(0);
      for (const c of a?.citations ?? []) {
        expect(c.authority_level, `${name} authority_level`).toBeTruthy();
        expect(typeof c.url).toBe("string");
        expect((c.url as string).startsWith("https")).toBe(true);
        expect(c.verified_at, `${name} verified_at`).toBeTruthy();
      }
    }
  });

  it("開業費・開発費は施行令の任意償却根拠を description に含む", () => {
    for (const name of ["開業費", "開発費"]) {
      const a = find(name);
      expect(a?.description).toMatch(/任意償却|均等償却/);
    }
  });
});

describe("#37 判例・裁決 notes 補強", () => {
  const rule = (id: string) => rules.find((r) => r.id === id);

  it("rule-18(外注費) notes に消基通1-1-1 の4要素と給与認定裁決が含まれる", () => {
    const n = rule("rule-18")?.notes ?? "";
    expect(n).toContain("1-1-1");
    expect(n).toMatch(/裁決/);
  });

  it("rule-26(接待交際費) notes に措置法通達61の4(1)-1 と1万円基準が含まれる", () => {
    const n = rule("rule-26")?.notes ?? "";
    expect(n).toContain("61の4(1)-1");
    expect(n).toMatch(/10,000円|1万円/);
  });

  it("rule-20(役員報酬) notes に法人税法施行令第70条と裁決が含まれる", () => {
    const n = rule("rule-20")?.notes ?? "";
    expect(n).toContain("第70条");
    expect(n).toMatch(/裁決/);
  });
});
