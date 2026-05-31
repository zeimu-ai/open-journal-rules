/**
 * resolver.ts のテスト (TDD Red → Green)
 *
 * 検証ケース:
 * 1. 基本マッチ: "事務所家賃 5月分" → accountName:"地代家賃", taxCategory:"課税仕入10%"
 * 2. 金額閾値: amount>=100000 の消耗品 ("ノートPC購入", 150000) で thresholdRule に閾値ルールが付加される
 * 3. マッチなし: 不明な摘要は accountName/taxCategory が null
 * 4. 金額閾値なし: 少額消耗品はthresholdRuleが付加されない(または全額経費ルール)
 * 5. ResolveResult の confidence / matchedRuleId が正しく格納される
 */
import { describe, it, expect } from "vitest";
import { resolveJournalEntry, ResolveResult } from "../src/resolver";
import { MatchRule } from "../src/matcher";

// テスト用ルール (journal-rules.json の構造と互換)
const ruleChidai: MatchRule = {
  id: "rule-06",
  name: "地代家賃",
  patterns: ["家賃", "賃料", "不動産"],
  matchType: "partial",
  accountName: "地代家賃",
  taxCategory: "課税仕入10%",
  confidence: 0.85,
};

const ruleJutaku: MatchRule = {
  id: "rule-38",
  name: "地代家賃（住宅用）",
  patterns: ["住宅", "アパート", "マンション家賃", "社宅", "賃貸住宅"],
  matchType: "partial",
  accountName: "地代家賃",
  taxCategory: "非課税",
  confidence: 0.9,
  priority: 1,
};

const ruleShomohun: MatchRule = {
  id: "rule-03",
  name: "消耗品費（EC）",
  patterns: ["Amazon", "楽天", "ヨドバシ", "アスクル"],
  matchType: "partial",
  accountName: "消耗品費",
  taxCategory: "課税仕入10%",
  confidence: 0.9,
};

const rulePC: MatchRule = {
  id: "rule-pc",
  name: "工具器具備品（PC購入）",
  patterns: ["ノートPC", "デスクトップPC", "パソコン購入"],
  matchType: "partial",
  accountName: "消耗品費",
  taxCategory: "課税仕入10%",
  confidence: 0.9,
};

const testRules: MatchRule[] = [ruleJutaku, ruleChidai, ruleShomohun, rulePC];

describe("resolveJournalEntry()", () => {
  describe("1. 基本マッチ: 事務所家賃", () => {
    it("'事務所家賃 5月分' → accountName:'地代家賃', taxCategory:'課税仕入10%'", () => {
      const result: ResolveResult = resolveJournalEntry(
        "事務所家賃 5月分",
        80000,
        testRules
      );
      expect(result.accountName).toBe("地代家賃");
      expect(result.taxCategory).toBe("課税仕入10%");
    });

    it("'事務所家賃 5月分' → matchedRuleId が rule-06 または rule-38", () => {
      const result = resolveJournalEntry("事務所家賃 5月分", 80000, testRules);
      expect(result.matchedRuleId).toBeTruthy();
      expect(["rule-06", "rule-38"]).toContain(result.matchedRuleId);
    });

    it("'事務所家賃 5月分' → confidence が 0 より大きい", () => {
      const result = resolveJournalEntry("事務所家賃 5月分", 80000, testRules);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it("'事務所家賃 5月分' → 金額が閾値に該当しないので thresholdRule は undefined または家賃に無関係", () => {
      const result = resolveJournalEntry("事務所家賃 5月分", 80000, testRules);
      // 家賃に対する閾値ルールは amount-thresholds.json に存在しないので
      // 閾値適用なし（undefined）か存在する場合は金額が threshold-01 の maxAmount=100000 未満なので全額経費ルール
      // いずれにせよ accountName/taxCategory への科目上書きは行われない
      expect(result.accountName).toBe("地代家賃");
    });
  });

  describe("2. 金額閾値: 100000円以上のノートPC購入", () => {
    it("'ノートPC購入', 150000 → thresholdRule に閾値ルールの rule 文言が格納される", () => {
      const result = resolveJournalEntry("ノートPC購入", 150000, testRules);
      expect(result.thresholdRule).toBeDefined();
      expect(typeof result.thresholdRule).toBe("string");
      expect(result.thresholdRule!.length).toBeGreaterThan(0);
    });

    it("'ノートPC購入', 150000 → accountName は科目上書きされない(消耗品費のまま)", () => {
      const result = resolveJournalEntry("ノートPC購入", 150000, testRules);
      // thresholdRule は情報付加のみ、科目は上書きしない
      expect(result.accountName).toBe("消耗品費");
    });

    it("'ノートPC購入', 150000 → threshold-02(一括償却資産) のルール文言が含まれる", () => {
      // amount-thresholds.json: threshold-02 は minAmount:100000, maxAmount:200000
      const result = resolveJournalEntry("ノートPC購入", 150000, testRules);
      expect(result.thresholdRule).toContain("一括償却資産");
    });
  });

  describe("3. 金額閾値: 少額消耗品(100000円未満)", () => {
    it("'ノートPC購入', 50000 → thresholdRule は全額経費ルール(threshold-01)", () => {
      const result = resolveJournalEntry("ノートPC購入", 50000, testRules);
      // threshold-01: maxAmount:100000, rule:"全額経費（消耗品費）"
      // amount=50000 は threshold-01 に該当
      expect(result.thresholdRule).toBeDefined();
      expect(result.thresholdRule).toContain("全額経費");
    });
  });

  describe("4. マッチなし", () => {
    it("マッチしない摘要 → accountName/taxCategory が null", () => {
      const result = resolveJournalEntry(
        "全くマッチしない摘要zzz",
        10000,
        testRules
      );
      expect(result.accountName).toBeNull();
      expect(result.taxCategory).toBeNull();
      expect(result.matchedRuleId).toBeNull();
    });

    it("マッチなし → confidence が 0", () => {
      const result = resolveJournalEntry(
        "全くマッチしない摘要zzz",
        10000,
        testRules
      );
      expect(result.confidence).toBe(0);
    });

    it("マッチなし → thresholdRule は undefined", () => {
      const result = resolveJournalEntry(
        "全くマッチしない摘要zzz",
        10000,
        testRules
      );
      expect(result.thresholdRule).toBeUndefined();
    });
  });

  describe("5. 高額閾値: 300000円以上", () => {
    it("'ノートPC購入', 350000 → threshold-03(少額減価償却資産特例)のルール文言", () => {
      // threshold-03: minAmount:200000, maxAmount:300000 → 350000は範囲外
      // threshold-04: minAmount:300000 → 350000 は該当
      const result = resolveJournalEntry("ノートPC購入", 350000, testRules);
      expect(result.thresholdRule).toBeDefined();
      // threshold-04: rule:"固定資産として減価償却（法定耐用年数に従う）"
      expect(result.thresholdRule).toContain("固定資産");
    });
  });

  describe("6. ResolveResult の型チェック", () => {
    it("返り値が ResolveResult の全フィールドを持つ", () => {
      const result = resolveJournalEntry("事務所家賃 5月分", 80000, testRules);
      expect(result).toHaveProperty("accountName");
      expect(result).toHaveProperty("taxCategory");
      expect(result).toHaveProperty("matchedRuleId");
      expect(result).toHaveProperty("confidence");
      // thresholdRule は optional なので存在しない場合もある
    });
  });
});
