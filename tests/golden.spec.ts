import { describe, it, expect } from "vitest";
import rules from "../rules/journal-rules.json";
import corpus from "./golden/mini-corpus.json";

type Rule = {
  id: string;
  patterns: string[];
  accountName: string;
  taxCategory: string;
};

type CorpusEntry = {
  input: string;
  expectedAccountName: string;
  expectedTaxCategory: string;
};

function findRule(input: string): Rule | undefined {
  // README と同じ素朴マッチ（配列先頭優先）
  return (rules as Rule[]).find((r) =>
    r.patterns.some((p) => input.includes(p))
  );
}

describe("golden baseline", () => {
  it("corpus should be non-empty", () => {
    expect(corpus.length).toBeGreaterThan(0);
  });

  it("precision baseline (informational only – no pass/fail threshold)", () => {
    let accountNameMatch = 0;
    let taxCategoryMatch = 0;
    const total = (corpus as CorpusEntry[]).length;

    for (const entry of corpus as CorpusEntry[]) {
      const matched = findRule(entry.input);
      if (matched) {
        if (matched.accountName === entry.expectedAccountName) {
          accountNameMatch++;
        }
        if (matched.taxCategory === entry.expectedTaxCategory) {
          taxCategoryMatch++;
        }
      }
    }

    // 精度をログ出力（assert はしない）
    console.log(
      `[golden baseline] accountName precision: ${accountNameMatch}/${total} (${((accountNameMatch / total) * 100).toFixed(1)}%)`
    );
    console.log(
      `[golden baseline] taxCategory precision: ${taxCategoryMatch}/${total} (${((taxCategoryMatch / total) * 100).toFixed(1)}%)`
    );

    // 精度の assert は行わない（バグの可視化が目的）
    // expect(corpus.length).toBeGreaterThan(0) のみ assert（上のテストで検証済み）
  });
});
