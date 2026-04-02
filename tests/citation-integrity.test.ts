import { describe, it, expect } from "vitest";
import rules from "../rules/journal-rules.json";
import mapping from "../rules/citation-mapping.json";

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
      const m = (mapping as Record<string, { expectedNumbers: string[] }>)[rule.accountName];
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
});
