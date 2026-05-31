import { describe, it, expect } from "vitest";
import grades from "../rules/standard-remuneration-grades.json";
import filing from "../rules/filing-deadlines.json";
import si from "../rules/social-insurance-rates.json";

type Grade = { grade: number; standardMonthly: number; remunerationFrom: number | null; remunerationTo: number | null };
type GradeTable = {
  insuranceType: string;
  effectiveFrom: string;
  bonusCap?: string;
  grades: Grade[];
  citations?: { url: string; evidenceQuote?: string }[];
};

const tables = (grades as { tables: GradeTable[] }).tables;
const kenko = tables.find((t) => t.insuranceType === "健康保険")!;
const kosei = tables.find((t) => t.insuranceType === "厚生年金")!;

describe("標準報酬月額等級表", () => {
  it("健康保険は50等級（第1=58,000円 / 第50=1,390,000円）", () => {
    expect(kenko.grades.length).toBe(50);
    expect(kenko.grades[0]).toMatchObject({ grade: 1, standardMonthly: 58000 });
    expect(kenko.grades[49]).toMatchObject({ grade: 50, standardMonthly: 1390000 });
  });

  it("厚生年金は32等級（第1=88,000円 / 第32=650,000円）", () => {
    expect(kosei.grades.length).toBe(32);
    expect(kosei.grades[0]).toMatchObject({ grade: 1, standardMonthly: 88000 });
    expect(kosei.grades[31]).toMatchObject({ grade: 32, standardMonthly: 650000 });
  });

  it("等級は連番・標準報酬月額は単調増加", () => {
    for (const t of tables) {
      for (let i = 0; i < t.grades.length; i++) {
        expect(t.grades[i].grade, `${t.insuranceType} idx${i}`).toBe(i + 1);
        if (i > 0) {
          expect(t.grades[i].standardMonthly).toBeGreaterThan(t.grades[i - 1].standardMonthly);
        }
      }
    }
  });

  it("標準賞与額の上限（健保=年573万 / 厚年=月150万）と effectiveFrom がある", () => {
    expect(kenko.bonusCap).toMatch(/573万/);
    expect(kosei.bonusCap).toMatch(/150万/);
    expect(kenko.effectiveFrom).toBe("2026-03-01");
    expect(kosei.effectiveFrom).toBe("2020-09-01");
    for (const t of tables) {
      expect((t.citations?.[0]?.url ?? "").startsWith("https"), t.insuranceType).toBe(true);
    }
  });
});

describe("申告ドメイン（源泉納付・法定調書）", () => {
  const items = (filing as { items: { key: string; value: string; effectiveFrom: string; citations?: unknown[] }[] }).items;
  const byKey = (k: string) => items.find((i) => i.key === k);

  it("源泉所得税の納付期限（翌月10日）", () => {
    expect(byKey("gensen_nofu_kigen")?.value).toMatch(/翌月10日/);
  });

  it("納期の特例（10人未満・年2回・7月10日/翌年1月20日）", () => {
    const v = byKey("noki_tokurei")?.value ?? "";
    expect(v).toMatch(/10人未満/);
    expect(v).toMatch(/7月10日/);
    expect(v).toMatch(/1月20日/);
  });

  it("法定調書の提出期限（翌年1月31日）", () => {
    expect(byKey("hotei_chosho")?.value).toMatch(/1月31日/);
  });

  it("全項目に effectiveFrom と citations がある", () => {
    for (const i of items) {
      expect(i.effectiveFrom, i.key).toBeTruthy();
      expect((i.citations ?? []).length, i.key).toBeGreaterThan(0);
    }
  });
});

describe("労災保険率（業種別・全額事業主負担）", () => {
  const rosai = (si as { rates: { insuranceType: string; scope?: string; industry?: string; rateEmployerPercent?: number; rateEmployeePercent?: number }[] }).rates.filter(
    (r) => r.insuranceType === "労災保険",
  );

  it("業種別の労災率が複数登録され、全額事業主負担（従業員負担0）", () => {
    expect(rosai.length).toBeGreaterThanOrEqual(10);
    for (const r of rosai) {
      expect(r.scope, r.industry).toBe("industry");
      expect(r.rateEmployeePercent, r.industry).toBe(0);
      expect(r.rateEmployerPercent, r.industry).toBeGreaterThan(0);
    }
  });

  it("その他の各種事業=0.3% / 金属鉱業=8.8%（最高率の例）", () => {
    expect(rosai.find((r) => r.industry?.includes("その他の各種事業"))?.rateEmployerPercent).toBe(0.3);
    expect(rosai.find((r) => r.industry?.includes("金属鉱業"))?.rateEmployerPercent).toBe(8.8);
  });
});
