import { describe, it, expect } from "vitest";
import rulesRaw from "../rules/journal-rules.json";
import depMethods from "../rules/depreciation-methods.json";
import homeProration from "../rules/home-proration.json";
import usefulLife from "../rules/useful-life.json";
import { match, type MatchRule } from "../src/matcher";

const rules = rulesRaw as unknown as MatchRule[];
const best = (d: string) => match(d, rules)[0]?.rule;

describe("#27 減価償却（償却方法・中古資産簡便法）", () => {
  it("減価償却費は不課税（内部費用配分・消費税の課税仕入外）", () => {
    const r = best("減価償却費 計上 5月");
    expect(r?.accountName).toBe("減価償却費");
    expect(r?.taxCategory).toBe("不課税");
  });

  it("償却方法の主体別法定方法が定義されている（個人=定額/法人=定率）", () => {
    expect(depMethods.entityDefaults.individual.defaultMethod).toBe("定額法");
    expect(depMethods.entityDefaults.corporation.defaultMethod).toBe("定率法");
  });

  it("中古資産簡便法の計算式が定義されている", () => {
    expect(depMethods.usedAssetSimplified.formulaPartial).toContain("20%");
    expect(depMethods.usedAssetSimplified.rules.join("")).toContain("2年");
  });

  it("useful-life にソフトウェア（自社利用5年・原本/研究開発3年）が追加されている", () => {
    const find = (kw: string) =>
      usefulLife.assets.find((a) => a.item.includes("ソフトウェア") && a.item.includes(kw))?.usefulLifeYears;
    expect(find("自社利用")).toBe(5);
    expect(find("複写")).toBe(3);
  });
});

describe("#30 個人事業特有（家事按分）", () => {
  it.each([
    ["家賃 按分 自宅兼事務所", "地代家賃"],
    ["水道光熱費 按分", "水道光熱費"],
    ["通信費 按分", "通信費"],
    ["車両費 按分", "車両費"],
    ["ガソリン代 按分", "車両費"],
  ])("%s → %s（個人のみ・課税仕入10%）", (desc, a) => {
    const r = best(desc);
    expect(r?.accountName).toBe(a);
    expect(r?.applicableEntity).toBe("individual");
    expect(r?.taxCategory).toBe("課税仕入10%");
  });

  it("通常の費用（按分なし）は既存ルールのまま（退行ガード）", () => {
    expect(best("NTT 固定電話 5月分")?.id).toBe("rule-01");
    expect(best("車両 ガソリン代 5月分")?.id).toBe("rule-29");
    expect(best("東京電力 電気代 5月分")?.id).toBe("rule-02");
  });

  it("家事按分の必要経費算入要件（所法45/所基通45-2）が定義されている", () => {
    expect(homeProration.appliesTo).toBe("individual");
    expect(homeProration.legalBasis.join("")).toContain("第45条");
    expect(homeProration.prorationCriteria.bookkeeping).toContain("事業主貸");
  });
});
