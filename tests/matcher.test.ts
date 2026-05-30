/**
 * matcher.ts のテスト (TDD Red → Green)
 *
 * 検証ケース:
 * 1. 正規化: "ＮＴＴ東日本" が rule-01(通信費) にマッチ
 * 2. excludePatterns: "ガスター10 購入" が rule-02(水道光熱費) にマッチしない
 * 3. 衝突解決(longest-match): "税理士会費" は rule-17(諸会費/不課税, pattern "税理士会") が
 *    rule-15(支払報酬, pattern "税理士") に勝つ
 * 4. priority: 広いパターンより具体的ルールが勝つ
 * 5. 複数マッチ時 best が先頭
 */
import { describe, it, expect } from "vitest";
import { match, MatchRule } from "../src/matcher";

// テスト用ルール定義 (journal-rules.json の構造と互換)
const rule01: MatchRule = {
  id: "rule-01",
  name: "通信費",
  patterns: ["NTT", "docomo", "ＮＴＴ"],
  matchType: "partial",
  accountName: "通信費",
  taxCategory: "課税仕入10%",
  confidence: 0.95,
};

const rule02: MatchRule = {
  id: "rule-02",
  name: "水道光熱費",
  patterns: ["ガス", "電力", "水道"],
  excludePatterns: ["ガスター", "ガスコンロ"],
  matchType: "partial",
  accountName: "水道光熱費",
  taxCategory: "課税仕入10%",
  confidence: 0.95,
};

// rule-15: 短いパターン "税理士"
const rule15: MatchRule = {
  id: "rule-15",
  name: "税理士等報酬",
  patterns: ["税理士"],
  matchType: "partial",
  accountName: "支払報酬",
  taxCategory: "課税仕入10%",
  confidence: 0.9,
};

// rule-17: 長いパターン "税理士会" (longest-match で優先される)
const rule17: MatchRule = {
  id: "rule-17",
  name: "会費",
  patterns: ["税理士会", "商工会"],
  matchType: "partial",
  accountName: "諸会費",
  taxCategory: "不課税",
  confidence: 0.9,
};

// priority テスト用ルール
const ruleGeneral: MatchRule = {
  id: "rule-general",
  name: "一般ルール",
  patterns: ["東京"],
  matchType: "partial",
  accountName: "雑費",
  taxCategory: "課税仕入10%",
  confidence: 0.7,
  priority: 0,
};

const ruleSpecific: MatchRule = {
  id: "rule-specific",
  name: "具体的ルール",
  patterns: ["東京電力"],
  matchType: "partial",
  accountName: "水道光熱費",
  taxCategory: "課税仕入10%",
  confidence: 0.95,
  priority: 10,
};

describe("match()", () => {
  describe("1. 正規化マッチ", () => {
    it("全角英字 'ＮＴＴ東日本' が partial matchType で rule-01 にマッチする", () => {
      const results = match("ＮＴＴ東日本", [rule01, rule02]);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].rule.id).toBe("rule-01");
    });

    it("マッチした pattern が matchedPattern に格納される", () => {
      const results = match("ＮＴＴ東日本", [rule01]);
      expect(results[0].matchedPattern).toBeTruthy();
      // 元の patterns のいずれかが normalizeText されて含まれる
      const normalized = results[0].matchedPattern;
      expect(typeof normalized).toBe("string");
      expect(normalized.length).toBeGreaterThan(0);
    });
  });

  describe("2. excludePatterns", () => {
    it("'ガスター10 購入' は rule-02(水道光熱費) にマッチしない", () => {
      const results = match("ガスター10 購入", [rule01, rule02]);
      const rule02Match = results.find((r) => r.rule.id === "rule-02");
      expect(rule02Match).toBeUndefined();
    });

    it("excludePatterns を含まない 'ガス代 支払' は rule-02 にマッチする", () => {
      const results = match("ガス代 支払", [rule01, rule02]);
      const rule02Match = results.find((r) => r.rule.id === "rule-02");
      expect(rule02Match).toBeDefined();
    });
  });

  describe("3. 衝突解決(longest-match)", () => {
    it("'税理士会費' は longest-match により rule-17(諸会費) が rule-15(支払報酬) に勝つ", () => {
      const results = match("税理士会費", [rule15, rule17]);
      expect(results.length).toBeGreaterThan(0);
      // rule-17 が先頭(ベストマッチ)
      expect(results[0].rule.id).toBe("rule-17");
    });

    it("'税理士会費' で rule-17 の matchedPattern が rule-15 より長い", () => {
      const results = match("税理士会費", [rule15, rule17]);
      const r15 = results.find((r) => r.rule.id === "rule-15");
      const r17 = results.find((r) => r.rule.id === "rule-17");
      // 両方マッチするが rule-17 の matchedPattern が長い
      expect(r17).toBeDefined();
      expect(r15).toBeDefined();
      if (r17 && r15) {
        expect(r17.matchedPattern.length).toBeGreaterThan(r15.matchedPattern.length);
      }
    });
  });

  describe("4. priority", () => {
    it("priority が高いルールが先頭に来る", () => {
      const results = match("東京電力 料金", [ruleGeneral, ruleSpecific]);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].rule.id).toBe("rule-specific");
    });

    it("priority 未指定は 0 として扱われる", () => {
      const results = match("東京", [ruleGeneral]);
      expect(results[0].rule.id).toBe("rule-general");
    });
  });

  describe("5. ソート順", () => {
    it("複数マッチ時 best(priority→matchedPattern.length→confidence)が先頭", () => {
      const results = match("税理士会費", [rule15, rule17]);
      expect(results[0].rule.id).toBe("rule-17");
    });

    it("マッチしない場合は空配列を返す", () => {
      const results = match("全くマッチしない文字列zzz", [rule01, rule02]);
      expect(results).toHaveLength(0);
    });
  });

  describe("6. matchType", () => {
    it("exact: 完全一致のみマッチ", () => {
      const ruleExact: MatchRule = {
        id: "rule-exact",
        name: "完全一致テスト",
        patterns: ["NTT"],
        matchType: "exact",
        accountName: "通信費",
        taxCategory: "課税仕入10%",
        confidence: 0.9,
      };
      expect(match("NTT", [ruleExact]).length).toBe(1);
      expect(match("NTT東日本", [ruleExact]).length).toBe(0);
    });

    it("prefix: 前方一致のみマッチ", () => {
      const rulePrefix: MatchRule = {
        id: "rule-prefix",
        name: "前方一致テスト",
        patterns: ["NTT"],
        matchType: "prefix",
        accountName: "通信費",
        taxCategory: "課税仕入10%",
        confidence: 0.9,
      };
      expect(match("NTT東日本", [rulePrefix]).length).toBe(1);
      expect(match("東日本NTT", [rulePrefix]).length).toBe(0);
    });

    it("partial: 部分一致でマッチ", () => {
      const rulePartial: MatchRule = {
        id: "rule-partial",
        name: "部分一致テスト",
        patterns: ["NTT"],
        matchType: "partial",
        accountName: "通信費",
        taxCategory: "課税仕入10%",
        confidence: 0.9,
      };
      expect(match("東日本NTT料金", [rulePartial]).length).toBe(1);
    });
  });
});
