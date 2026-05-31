import { describe, it, expect } from "vitest";
import rules from "../rules/journal-rules.json";
import mapping from "../rules/citation-mapping.json";

type Citation = {
  source?: unknown;
  number?: unknown;
  url?: unknown;
  verified_at?: unknown;
  [key: string]: unknown;
};

type MappingEntry = {
  tax: string;
  expectedNumbers: string[];
};

describe("citation integrity", () => {
  it("No.6209 は不課税の汎用根拠として使われていないこと", () => {
    const violations = rules.filter((r) => {
      const num = r.citations?.[0]?.number;
      return num === "No.6209" && r.accountName !== "租税公課";
    });
    if (violations.length > 0) {
      const names = violations.map((v) => `${v.name}(${v.id})`).join(", ");
      expect.fail(`No.6209 が不適切に使用されている: ${names}`);
    }
  });

  it("各ルールの citation.number がマッピングマスタの expectedNumbers に含まれること", () => {
    const violations: string[] = [];
    for (const rule of rules) {
      const num = rule.citations?.[0]?.number;
      if (!num) continue;
      const m = (mapping as Record<string, MappingEntry>)[rule.accountName];
      if (!m) continue;
      if (!m.expectedNumbers.includes(num)) {
        violations.push(
          `${rule.id} ${rule.name}: 期待=${m.expectedNumbers.join("/")} 実際=${num}`,
        );
      }
    }
    if (violations.length > 0) {
      expect.fail(`citation 不整合:\n${violations.join("\n")}`);
    }
  });

  it("全ルールの全 citations に source/number/url/verified_at が存在し url が https で始まること", () => {
    const violations: string[] = [];
    for (const rule of rules) {
      const citations = rule.citations ?? [];
      citations.forEach((citation: Citation, idx: number) => {
        const prefix = `${rule.id} ${rule.name} citations[${idx}]`;
        if (!citation.source) {
          violations.push(`${prefix}: source が存在しない`);
        }
        if (!citation.number) {
          violations.push(`${prefix}: number が存在しない`);
        }
        if (!citation.url) {
          violations.push(`${prefix}: url が存在しない`);
        } else if (typeof citation.url !== "string" || !citation.url.startsWith("https")) {
          violations.push(`${prefix}: url が https で始まらない (${citation.url})`);
        }
        if (!citation.verified_at) {
          violations.push(`${prefix}: verified_at が存在しない`);
        }
      });
    }
    if (violations.length > 0) {
      expect.fail(`citation フィールド不整合:\n${violations.join("\n")}`);
    }
  });

  it("No.2210 汎用流用の現状を可視化する(警告のみ・expect.fail しない)", () => {
    const no2210Rules = rules.filter((r) => r.citations?.[0]?.number === "No.2210");
    const accountNames = [...new Set(no2210Rules.map((r) => r.accountName))].sort();
    if (no2210Rules.length > 0) {
      console.warn(
        `[B-25 CI警告] No.2210(必要経費の概説)を citations[0] に使用しているルール: ${no2210Rules.length}件\n` +
          `科目一覧(${accountNames.length}科目): ${accountNames.join(", ")}\n` +
          "→ 将来の段階対応で科目固有の根拠番号へ置換予定",
      );
    }
    // 警告のみ。テストは常にパス。
    expect(true).toBe(true);
  });

  it("taxCategory が1種類のみの accountName は citation-mapping の tax と一致すること", () => {
    // accountName ごとに taxCategory の集合を収集
    const accTaxMap = new Map<string, Set<string>>();
    for (const rule of rules) {
      if (!accTaxMap.has(rule.accountName)) {
        accTaxMap.set(rule.accountName, new Set());
      }
      accTaxMap.get(rule.accountName)!.add(rule.taxCategory);
    }

    const violations: string[] = [];
    const typedMapping = mapping as Record<string, MappingEntry>;

    for (const [accountName, taxSet] of accTaxMap) {
      // 複数 taxCategory を持つ accountName は偽陽性回避のため除外
      if (taxSet.size !== 1) continue;
      // mapping に存在しない accountName はスキップ
      const mappingEntry = typedMapping[accountName];
      if (!mappingEntry) continue;

      const ruleTax = Array.from(taxSet)[0];
      const mappingTax = mappingEntry.tax;
      if (ruleTax !== mappingTax) {
        violations.push(
          `${accountName}: ルール側=${ruleTax} / citation-mapping側=${mappingTax}`,
        );
      }
    }

    if (violations.length > 0) {
      expect.fail(`taxCategory 横断不整合:\n${violations.join("\n")}`);
    }
  });
});
