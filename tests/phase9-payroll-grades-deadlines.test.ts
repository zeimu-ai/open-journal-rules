import { describe, it, expect } from "vitest";
import si from "../rules/social-insurance-rates.json";
import fd from "../rules/filing-deadlines.json";
import grades from "../rules/standard-remuneration-grades.json";

type Rate = {
  key: string;
  insuranceType: string;
  scope: string;
  industryCode?: number;
  rateTotalPercent?: number;
  rateEmployeePercent?: number;
  rateEmployerPercent?: number;
  verified?: boolean;
};

type Deadline = {
  key: string;
  category: string;
  rule: string;
  verified: boolean;
  effectiveFrom: string;
  periodRules?: { period?: string; condition?: string; dueDate: string }[];
  citations?: { url: string; evidenceQuote?: string }[];
};

type Grade = {
  grade: number;
  standardMonthly: number;
  remunerationFrom: number | null;
  remunerationTo: number | null;
};

type GradeTable = {
  insuranceType: string;
  scope: string;
  gradeCount: number;
  effectiveFrom: string;
  grades: Grade[];
};

const siRates = (si as { rates: Rate[] }).rates;
const deadlines = (fd as { deadlines: Deadline[] }).deadlines;
const tables = (grades as { tables: GradeTable[] }).tables;

describe("労災保険料率（業種別）", () => {
  const rosai = siRates.filter((r) => r.insuranceType === "労災保険");

  it("17業種を収録している", () => {
    expect(rosai.length).toBe(17);
  });

  it("全て全額事業主負担（従業員0% / 事業主=合計）", () => {
    for (const r of rosai) {
      expect(r.rateEmployeePercent, r.key).toBe(0);
      expect(r.rateEmployerPercent, r.key).toBe(r.rateTotalPercent);
    }
  });

  it("全レコードに業種番号(industryCode)があり verified=true", () => {
    for (const r of rosai) {
      expect(typeof r.industryCode, r.key).toBe("number");
      expect(r.verified, r.key).toBe(true);
    }
  });

  it("その他の各種事業（業種番号94）は 0.3%", () => {
    const r = rosai.find((x) => x.industryCode === 94);
    expect(r?.rateTotalPercent).toBe(0.3);
  });

  it("業種番号は重複しない", () => {
    const codes = rosai.map((r) => r.industryCode);
    expect(new Set(codes).size).toBe(codes.length);
  });
});

describe("申告・提出期限（filing-deadlines）", () => {
  const byKey = (k: string) => deadlines.find((d) => d.key === k);

  it("5件すべて verified=true", () => {
    expect(deadlines.length).toBe(5);
    for (const d of deadlines) expect(d.verified, d.key).toBe(true);
  });

  it("category は許可された3種のいずれか", () => {
    const allowed = new Set(["源泉納付", "法定調書", "給与支払報告書"]);
    for (const d of deadlines) expect(allowed.has(d.category), d.key).toBe(true);
  });

  it("源泉所得税の納付期限（原則）は翌月10日", () => {
    expect(byKey("gensen_nofu_kigen")?.rule).toContain("翌月10日");
  });

  it("納期の特例は1〜6月分=7月10日 / 7〜12月分=翌年1月20日の2期間", () => {
    const r = byKey("noki_tokurei");
    expect(r?.periodRules?.length).toBe(2);
    expect(r?.periodRules?.[0]?.dueDate).toContain("7月10日");
    expect(r?.periodRules?.[1]?.dueDate).toContain("1月20日");
  });

  it("全レコードに effectiveFrom(ISO) と evidenceQuote 付き citations がある", () => {
    for (const d of deadlines) {
      expect(d.effectiveFrom, d.key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(d.citations?.length, d.key).toBeGreaterThan(0);
      expect(d.citations?.[0]?.evidenceQuote, d.key).toBeTruthy();
    }
  });
});

describe("標準報酬月額等級表（standard-remuneration-grades）", () => {
  const byType = (t: string) => tables.find((x) => x.insuranceType === t);

  it("健康保険50等級・厚生年金32等級を収録", () => {
    expect(byType("健康保険")?.gradeCount).toBe(50);
    expect(byType("厚生年金")?.gradeCount).toBe(32);
  });

  it("gradeCount と grades.length が一致する", () => {
    for (const t of tables) {
      expect(t.grades.length, t.insuranceType).toBe(t.gradeCount);
    }
  });

  it("等級は 1..N の連番", () => {
    for (const t of tables) {
      t.grades.forEach((g, i) => {
        expect(g.grade, `${t.insuranceType}[${i}]`).toBe(i + 1);
      });
    }
  });

  it("標準報酬月額は等級が上がるほど単調増加する", () => {
    for (const t of tables) {
      for (let i = 1; i < t.grades.length; i++) {
        expect(
          t.grades[i].standardMonthly,
          `${t.insuranceType} grade ${t.grades[i].grade}`,
        ).toBeGreaterThan(t.grades[i - 1].standardMonthly);
      }
    }
  });

  it("報酬月額の区間が連続する（前等級のTo == 次等級のFrom）", () => {
    for (const t of tables) {
      for (let i = 1; i < t.grades.length; i++) {
        expect(
          t.grades[i].remunerationFrom,
          `${t.insuranceType} grade ${t.grades[i].grade}`,
        ).toBe(t.grades[i - 1].remunerationTo);
      }
    }
  });

  it("先頭等級は下限なし(null)・最終等級は上限なし(null)", () => {
    for (const t of tables) {
      expect(t.grades[0].remunerationFrom, t.insuranceType).toBeNull();
      expect(t.grades[t.grades.length - 1].remunerationTo, t.insuranceType).toBeNull();
    }
  });

  it("健保 grade1=58,000円 / grade50=1,390,000円", () => {
    const h = byType("健康保険")!;
    expect(h.grades[0].standardMonthly).toBe(58000);
    expect(h.grades[49].standardMonthly).toBe(1390000);
  });

  it("厚年 grade1=88,000円 / grade32=650,000円", () => {
    const k = byType("厚生年金")!;
    expect(k.grades[0].standardMonthly).toBe(88000);
    expect(k.grades[31].standardMonthly).toBe(650000);
  });

  // 全等級の標準報酬月額を一次資料（協会けんぽ/日本年金機構）の値で固定。
  // 単調増加・区間連続性だけでは中間等級の金額誤りを検出できないため実値でピン留めする
  // （例: 健保第44級を 1,040,000 と誤記しても従来テストは緑になっていた → 正は 1,030,000）。
  it("健康保険50等級の標準報酬月額が一次資料の実値と一致する", () => {
    const expected = [
      58000, 68000, 78000, 88000, 98000, 104000, 110000, 118000, 126000, 134000,
      142000, 150000, 160000, 170000, 180000, 190000, 200000, 220000, 240000, 260000,
      280000, 300000, 320000, 340000, 360000, 380000, 410000, 440000, 470000, 500000,
      530000, 560000, 590000, 620000, 650000, 680000, 710000, 750000, 790000, 830000,
      880000, 930000, 980000, 1030000, 1090000, 1150000, 1210000, 1270000, 1330000, 1390000,
    ];
    const h = byType("健康保険")!;
    expect(h.grades.map((g) => g.standardMonthly)).toEqual(expected);
  });

  it("厚生年金32等級の標準報酬月額が一次資料の実値と一致する", () => {
    const expected = [
      88000, 98000, 104000, 110000, 118000, 126000, 134000, 142000, 150000, 160000,
      170000, 180000, 190000, 200000, 220000, 240000, 260000, 280000, 300000, 320000,
      340000, 360000, 380000, 410000, 440000, 470000, 500000, 530000, 560000, 590000,
      620000, 650000,
    ];
    const k = byType("厚生年金")!;
    expect(k.grades.map((g) => g.standardMonthly)).toEqual(expected);
  });
});
