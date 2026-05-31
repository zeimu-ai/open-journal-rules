import { describe, it, expect } from "vitest";
import accountsRaw from "../rules/account-master.json";
import rulesRaw from "../rules/journal-rules.json";
import { match, type MatchRule } from "../src/matcher";

const accounts = accountsRaw as unknown as Array<Record<string, unknown>>;
const rules = rulesRaw as unknown as MatchRule[];

function best(desc: string) {
  const r = match(desc, rules);
  return r[0]?.rule;
}

describe("Phase1 #17/#19 新規収益科目", () => {
  it.each([
    ["雑収入", "income", "不課税"],
    ["受取配当金", "income", "不課税"],
    ["受取利息", "income", "非課税"],
  ])("%s が account-master に追加されている", (name, category, taxDefault) => {
    const a = accounts.find((x) => x.name === name);
    expect(a, name).toBeDefined();
    expect(a?.category).toBe(category);
    expect(a?.taxDefault).toBe(taxDefault);
  });
});

describe("Phase1 #15 軽減税率8%", () => {
  it("飲食料品の仕入は 課税仕入8%（軽減税率）", () => {
    const r = best("業務用食材 仕入");
    expect(r?.accountName).toBe("仕入高");
    expect(r?.taxCategory).toBe("課税仕入8%（軽減税率）");
  });
  it("定期購読新聞は 新聞図書費 / 8%（書籍10%より優先）", () => {
    const r = best("日経新聞 定期購読 6月分");
    expect(r?.accountName).toBe("新聞図書費");
    expect(r?.taxCategory).toBe("課税仕入8%（軽減税率）");
  });
  it("食品特定語は『仕入』との引き分けでも8%が優先される(rule-39 priority)", () => {
    // 「精肉 仕入」は rule-39(精肉/2文字) と rule-28(仕入/2文字) が同長だが priority で8%が勝つ
    expect(best("精肉 仕入")?.taxCategory).toBe("課税仕入8%（軽減税率）");
  });
});

describe("Phase1 #16 非課税網羅", () => {
  it("借地料は 地代家賃 / 非課税", () => {
    const r = best("借地料 5月分");
    expect(r?.accountName).toBe("地代家賃");
    expect(r?.taxCategory).toBe("非課税");
  });
  it("建物の地代家賃は 課税仕入10% のまま（土地非課税ルールに誤って奪われない）", () => {
    const r = best("地代家賃 事務所 5月分");
    expect(r?.taxCategory).toBe("課税仕入10%");
  });
  it("行政手数料(登記)は 租税公課 / 非課税", () => {
    const r = best("登記手数料 法務局");
    expect(r?.accountName).toBe("租税公課");
    expect(r?.taxCategory).toBe("非課税");
  });
});

describe("Phase1 #17 不課税網羅", () => {
  it.each(["補助金 入金", "損害賠償金 受取", "保険金 受取", "受取配当金 入金"])(
    "%s は 不課税",
    (desc) => {
      expect(best(desc)?.taxCategory).toBe("不課税");
    },
  );
});

describe("Phase1 #19 売上側", () => {
  it("売上値引・返品は 売上高 / 課税売上10%", () => {
    const r = best("売上値引 返品");
    expect(r?.accountName).toBe("売上高");
    expect(r?.taxCategory).toBe("課税売上10%");
  });
  it("受取利息は 受取利息 / 非課税", () => {
    const r = best("受取利息 普通預金");
    expect(r?.accountName).toBe("受取利息");
    expect(r?.taxCategory).toBe("非課税");
  });
});

describe("Phase1 誤爆防止(code-review 反映)", () => {
  it("『来客接待』は会議費に奪われず接待交際費になる(rule-25 excludePatterns)", () => {
    expect(best("来客 接待 懇親会")?.accountName).toBe("接待交際費");
  });
});

describe("Phase1 #18/#21 既存ルールへの根拠付与", () => {
  it("接待交際費(rule-26)に措置法61の4の損金不算入の注記がある", () => {
    const r = rules.find((x) => x.id === "rule-26") as Record<string, unknown>;
    expect(String(r.notes)).toContain("措置法61の4");
  });
  it("支払報酬(rule-15)に源泉徴収(No.2792)の citation が追加されている", () => {
    const r = rules.find((x) => x.id === "rule-15") as Record<string, unknown>;
    const nums = (r.citations as Array<{ number?: string }>).map((c) => c.number);
    expect(nums).toContain("No.2792");
  });
});

describe("Phase1 #22 corpus 未カバー解消", () => {
  it.each([
    ["新幹線 東京大阪 出張", "旅費交通費"],
    ["車両 ガソリン代 5月分", "車両費"],
    ["来客 会議費 昼食代", "会議費"],
  ])("%s → %s", (desc, acct) => {
    expect(best(desc)?.accountName).toBe(acct);
  });
});
