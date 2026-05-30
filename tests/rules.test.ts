import { describe, it, expect } from "vitest";
import { globSync, readFileSync } from "node:fs";
import rules from "../rules/journal-rules.json";
import accounts from "../rules/account-master.json";
import taxes from "../rules/tax-categories.json";
import thresholds from "../rules/amount-thresholds.json";

const VALID_TAX_CATEGORIES = [
  "課税仕入10%",
  "課税売上10%",
  "非課税",
  "不課税",
  "課税仕入8%（軽減税率）",
];

describe("journal-rules.json", () => {
  it("should have at least 1 rule", () => {
    expect(rules.length).toBeGreaterThanOrEqual(1);
  });

  it("all ids should be unique", () => {
    const ids = rules.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("each rule should have required fields", () => {
    for (const rule of rules) {
      expect(rule.id).toBeDefined();
      expect(rule.name).toBeDefined();
      expect(rule.patterns.length).toBeGreaterThan(0);
      expect(rule.accountName).toBeDefined();
      expect(rule.taxCategory).toBeDefined();
      expect(Array.isArray(rule.citations)).toBe(true);
      expect(rule.confidence).toBeGreaterThanOrEqual(0);
      expect(rule.confidence).toBeLessThanOrEqual(1);
    }
  });

  it("each rule taxCategory should be a valid value", () => {
    for (const rule of rules) {
      expect(VALID_TAX_CATEGORIES).toContain(rule.taxCategory);
    }
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
  it("should have at least 1 account", () => {
    expect(accounts.length).toBeGreaterThanOrEqual(1);
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

describe("accountName 参照整合性", () => {
  const masterNames = new Set(accounts.map((a) => a.name));

  it("journal-rules.json の全 accountName が account-master.json に存在すること", () => {
    const missing: string[] = [];
    for (const rule of rules) {
      if (!masterNames.has(rule.accountName)) {
        missing.push(`rule[${rule.id}] "${rule.accountName}"`);
      }
    }
    if (missing.length > 0) {
      expect.fail(
        `account-master.json に存在しない accountName:\n${missing.join("\n")}`,
      );
    }
  });

  it("templates/*.json の全 accountName が account-master.json に存在すること", () => {
    const templateFiles = globSync(
      new URL("../rules/templates/*.json", import.meta.url).pathname,
    );
    const missing: string[] = [];
    for (const f of templateFiles) {
      const entries = JSON.parse(readFileSync(f, "utf-8")) as Array<
        Record<string, unknown>
      >;
      for (const entry of entries) {
        const name = entry["accountName"] as string | undefined;
        if (name && !masterNames.has(name)) {
          missing.push(`${f}: "${name}"`);
        }
      }
    }
    if (missing.length > 0) {
      expect.fail(
        `account-master.json に存在しない accountName (templates):\n${missing.join("\n")}`,
      );
    }
  });
});

describe("tax-categories.json", () => {
  it("should have at least 1 entry", () => {
    expect(taxes.length).toBeGreaterThanOrEqual(1);
  });

  it("each tax-category entry should have required fields", () => {
    for (const tax of taxes) {
      expect(tax.accountName).toBeDefined();
      expect(tax.taxDefault).toBeDefined();
    }
  });
});

describe("amount-thresholds.json", () => {
  it("should have at least 1 threshold", () => {
    expect(thresholds.length).toBeGreaterThanOrEqual(1);
  });

  it("each threshold should have required fields", () => {
    for (const threshold of thresholds) {
      expect(threshold.id).toBeDefined();
      expect(threshold.rule).toBeDefined();
    }
  });
});
