import { describe, it, expect } from "vitest";
import si from "../rules/social-insurance-rates.json";
import wh from "../rules/withholding-tax-rates.json";

type Rate = {
  key: string;
  rateTotalPercent?: number;
  rateEmployeePercent?: number;
  rateEmployerPercent?: number;
  effectiveFrom: string;
  effectiveTo?: string | null;
  verified?: boolean;
  citations?: { url: string; evidenceQuote?: string }[];
  brackets?: { rate: number }[];
};

const siRates = (si as { rates: Rate[] }).rates;
const whRates = (wh as { rates: Rate[] }).rates;

describe("社会保険料率（給与計算・社保）", () => {
  const byKey = (k: string) => siRates.find((r) => r.key === k);

  it("厚生年金 18.3%（折半9.15%）", () => {
    const r = byKey("kosei_nenkin");
    expect(r?.rateTotalPercent).toBe(18.3);
    expect(r?.rateEmployeePercent).toBe(9.15);
    expect(r?.rateEmployerPercent).toBe(9.15);
    expect(r?.effectiveFrom).toBe("2017-09-01");
  });

  it("健保 東京都 令和8年度 9.85%（折半4.925%）", () => {
    const r = byKey("kenko_hoken_tokyo");
    expect(r?.rateTotalPercent).toBe(9.85);
    expect(r?.rateEmployeePercent).toBe(4.925);
    expect(r?.effectiveFrom).toBe("2026-03-01");
  });

  it("健保 大阪/愛知/福岡 令和8年度の料率", () => {
    expect(byKey("kenko_hoken_osaka")?.rateTotalPercent).toBe(10.13);
    expect(byKey("kenko_hoken_aichi")?.rateTotalPercent).toBe(9.93);
    expect(byKey("kenko_hoken_fukuoka")?.rateTotalPercent).toBe(10.11);
  });

  it("介護保険 全国一律 1.62%", () => {
    expect(byKey("kaigo_hoken")?.rateTotalPercent).toBe(1.62);
  });

  it("雇用保険 一般の事業 労0.5/事0.85/計1.35%（令和8年度）", () => {
    const r = byKey("koyo_hoken_ippan");
    expect(r?.rateEmployeePercent).toBe(0.5);
    expect(r?.rateEmployerPercent).toBe(0.85);
    expect(r?.rateTotalPercent).toBe(1.35);
    expect(r?.effectiveFrom).toBe("2026-04-01");
    expect(r?.effectiveTo).toBe("2027-03-31");
  });

  it("雇用保険 農林水産・清酒製造 労0.6/事0.95/計1.55%", () => {
    const r = byKey("koyo_hoken_norin");
    expect(r?.rateEmployeePercent).toBe(0.6);
    expect(r?.rateEmployerPercent).toBe(0.95);
    expect(r?.rateTotalPercent).toBe(1.55);
  });

  it("雇用保険 建設の事業 計1.65%", () => {
    expect(byKey("koyo_hoken_kensetsu")?.rateTotalPercent).toBe(1.65);
  });

  it("料率の内部整合: 折半scope=nationalは employee+employer=total", () => {
    for (const r of siRates) {
      if (
        r.rateTotalPercent != null &&
        r.rateEmployeePercent != null &&
        r.rateEmployerPercent != null
      ) {
        const sum = Math.round((r.rateEmployeePercent + r.rateEmployerPercent) * 1000) / 1000;
        expect(sum, r.key).toBe(r.rateTotalPercent);
      }
    }
  });

  it("子ども・子育て拠出金 0.36%（全額事業主負担）", () => {
    const r = byKey("kodomo_kosodate");
    expect(r?.rateEmployerPercent).toBe(0.36);
    expect(r?.rateEmployeePercent).toBe(0);
  });

  it("全レコードに effectiveFrom(ISO) と citations(https url + evidenceQuote) がある", () => {
    for (const r of siRates) {
      expect(r.effectiveFrom, r.key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(r.citations?.length, r.key).toBeGreaterThan(0);
      expect((r.citations![0].url ?? "").startsWith("https"), r.key).toBe(true);
      expect(r.citations![0].evidenceQuote, r.key).toBeTruthy();
    }
  });
});

describe("源泉徴収（withholding）", () => {
  const byKey = (k: string) => whRates.find((r) => r.key === k);

  it("報酬・料金の源泉 10.21% / 20.42%", () => {
    const r = byKey("gensen_hoshu_shiho");
    expect(r?.brackets?.[0]?.rate).toBe(10.21);
    expect(r?.brackets?.[1]?.rate).toBe(20.42);
  });

  it("復興特別所得税 2.1%（2037-12-31まで）", () => {
    const r = byKey("fukko_tokubetsu");
    expect(r?.rateTotalPercent).toBe(2.1);
    expect(r?.effectiveTo).toBe("2037-12-31");
  });

  it("給与の源泉徴収税額表は据え置き（verified=false・外部参照のみ）", () => {
    const r = byKey("gensen_kyuyo_gakuhyo");
    expect(r?.verified).toBe(false);
  });

  it("全レコードに effectiveFrom と citations がある", () => {
    for (const r of whRates) {
      expect(r.effectiveFrom, r.key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(r.citations?.length, r.key).toBeGreaterThan(0);
    }
  });
});
