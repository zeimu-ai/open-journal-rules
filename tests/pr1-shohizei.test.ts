import { describe, it, expect } from "vitest";
import rulesRaw from "../rules/journal-rules.json";
import accountsRaw from "../rules/account-master.json";
import { match, type MatchRule } from "../src/matcher";

const rules = rulesRaw as unknown as MatchRule[];
const accounts = accountsRaw as unknown as Array<Record<string, unknown>>;
const best = (d: string) => match(d, rules)[0]?.rule;
const ruleById = (id: string) => rules.find((r) => r.id === id) as Record<string, unknown>;

describe("#16 非課税取引の網羅（消費税法別表第二・未収録類型）", () => {
  it.each([
    ["土地 売却 代金 受取", "固定資産売却損益", "非課税"],
    ["土地売却益", "固定資産売却損益", "非課税"],
    ["土地 購入", "土地", "非課税"],
    ["土地 取得 代金 支払", "土地", "非課税"],
    ["郵便切手 購入", "通信費", "非課税"],
    ["切手代", "通信費", "非課税"],
    ["信用保証料 支払", "支払手数料", "非課税"],
    ["保証協会 保証料", "支払手数料", "非課税"],
    ["商品券 購入", "接待交際費", "非課税"],
    ["ギフト券 購入", "接待交際費", "非課税"],
    ["デイサービス 利用料", "福利厚生費", "非課税"],
    ["訪問介護 費用", "福利厚生費", "非課税"],
    ["教科書代", "新聞図書費", "非課税"],
    ["検定教科書 購入", "新聞図書費", "非課税"],
  ])("%s → %s/%s", (desc, acct, tax) => {
    const r = best(desc);
    expect(r?.accountName).toBe(acct);
    expect(r?.taxCategory).toBe(tax);
  });

  it("新規科目「土地」が account-master に追加されている（資産・非課税）", () => {
    const a = accounts.find((x) => x.name === "土地");
    expect(a?.category).toBe("asset");
    expect(a?.taxDefault).toBe("非課税");
  });

  it("既存の非課税/不課税ルールは不変（退行ガード）", () => {
    expect(best("土地賃借料 5月分")?.id).toBe("rule-41"); // 借地は非課税のまま
    expect(best("収入印紙 購入")?.id).toBe("rule-57"); // 収入印紙は不課税のまま
    expect(best("損害保険料 年払い")?.taxCategory).toBe("非課税");
  });

  it("郵便切手は非課税・収入印紙は不課税で区分が分かれる", () => {
    expect(best("郵便切手 購入")?.taxCategory).toBe("非課税");
    expect(best("収入印紙 購入")?.taxCategory).toBe("不課税");
  });

  it("参考書・テキストは教科用図書の非課税に該当しない（excludePatternsで除外）", () => {
    // 検定教科書ルール(rule-74)にはマッチしない
    const r = best("参考書 購入");
    expect(r?.id).not.toBe("rule-74");
  });
});

describe("#23 課税仕入の用途区分（purposeCategory）", () => {
  it.each([
    ["rule-01", "common"],
    ["rule-05", "taxable_sales"],
    ["rule-07", "taxable_sales"],
    ["rule-08", "taxable_sales"],
    ["rule-09", "common"],
    ["rule-15", "common"],
  ])("%s に purposeCategory=%s が付与されている", (id, pc) => {
    expect(ruleById(id).purposeCategory).toBe(pc);
  });

  it("purposeCategory は課税仕入ルールにのみ付与される（非課税/課税売上の新ルールには付かない）", () => {
    expect(ruleById("rule-68").purposeCategory).toBeUndefined(); // 土地売却(非課税売上)
    expect(ruleById("rule-78").purposeCategory).toBeUndefined(); // 割賦(課税売上)
    expect(ruleById("rule-75").purposeCategory).toBe("nontaxable_sales"); // 住宅貸付仕入(課税仕入)
  });
});

describe("#39 計上時期（リース/割賦/工事進行基準）の区分", () => {
  it.each([
    ["ファイナンスリース 複合機取得", "ファイナンスリース資産", "課税仕入10%"],
    ["所有権移転外リース 設備", "ファイナンスリース資産", "課税仕入10%"],
    ["オペレーティングリース 月額", "リース料", "課税仕入10%"],
    ["オペレーティング・リース料", "リース料", "課税仕入10%"],
    ["割賦販売 商品引渡し", "売上高", "課税売上10%"],
    ["延払販売 売上", "売上高", "課税売上10%"],
    ["工事進行基準 部分検収", "完成工事高", "課税売上10%"],
    ["進行基準売上 計上", "完成工事高", "課税売上10%"],
  ])("%s → %s/%s", (desc, acct, tax) => {
    const r = best(desc);
    expect(r?.accountName).toBe(acct);
    expect(r?.taxCategory).toBe(tax);
  });

  it("一般的なリース料は既存rule-30(リース料)のまま（FL/OL特定文字列がなければ上書きしない）", () => {
    expect(best("リース料 複合機 5月分")?.id).toBe("rule-30");
  });

  it("ファイナンスリース資産が account-master に追加されている（資産・課税仕入10%）", () => {
    const a = accounts.find((x) => x.name === "ファイナンスリース資産");
    expect(a?.category).toBe("asset");
    expect(a?.taxDefault).toBe("課税仕入10%");
  });

  it("rule-76(FL)の citation は No.5702 のみ（No.5704は売買記述を含まないため除外）", () => {
    const nums = (ruleById("rule-76").citations as Array<{ number: string }>).map((c) => c.number);
    expect(nums).toContain("No.5702");
    expect(nums).not.toContain("No.5704");
  });
});
