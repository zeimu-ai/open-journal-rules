import { describe, it, expect } from "vitest";
import rules from "../rules/journal-rules.json";
import accounts from "../rules/account-master.json";
import taxes from "../rules/tax-categories.json";
import thresholds from "../rules/amount-thresholds.json";

describe("journal-rules.json", () => {
  it("should have 33 rules", () => {
    expect(rules).toHaveLength(33);
  });

  it("each rule should have required fields", () => {
    for (const rule of rules) {
      expect(rule.id).toBeDefined();
      expect(rule.name).toBeDefined();
      expect(rule.patterns.length).toBeGreaterThan(0);
      expect(rule.accountName).toBeDefined();
      expect(rule.taxCategory).toBeDefined();
      expect(rule.confidence).toBeGreaterThanOrEqual(0);
      expect(rule.confidence).toBeLessThanOrEqual(1);
    }
  });

  it("each rule should have unique id", () => {
    const ids = rules.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("each rule should have citations array", () => {
    for (const rule of rules) {
      expect(Array.isArray(rule.citations)).toBe(true);
    }
  });

  it("rules with sourceUrl should have non-empty citations", () => {
    for (const rule of rules) {
      if (rule.sourceUrl) {
        expect(rule.citations.length).toBeGreaterThan(0);
      }
    }
  });

  it("each citation should have url and number", () => {
    for (const rule of rules) {
      for (const c of rule.citations) {
        expect(c.url).toMatch(/^https:\/\//);
        expect(c.source).toBeDefined();
        expect(c.verified_at).toBeDefined();
      }
    }
  });
});

describe("account-master.json", () => {
  it("should have 31 accounts", () => {
    expect(accounts).toHaveLength(31);
  });

  it("each account should have name and valid category", () => {
    for (const acc of accounts) {
      expect(acc.name).toBeDefined();
      expect(["income", "expense", "asset", "liability"]).toContain(acc.category);
    }
  });

  it("each account should have citations array with at least 1 entry", () => {
    for (const acc of accounts) {
      expect(Array.isArray(acc.citations)).toBe(true);
      expect(acc.citations.length).toBeGreaterThan(0);
      for (const c of acc.citations) {
        expect(c.url).toMatch(/^https:\/\//);
      }
    }
  });
});

describe("tax-categories.json", () => {
  it("should have 17 entries", () => {
    expect(taxes).toHaveLength(17);
  });
});

describe("amount-thresholds.json", () => {
  it("should have 7 thresholds", () => {
    expect(thresholds).toHaveLength(7);
  });
});
