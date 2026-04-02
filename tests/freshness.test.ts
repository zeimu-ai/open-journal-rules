import { describe, it, expect } from "vitest";
import rules from "../rules/journal-rules.json";
import accounts from "../rules/account-master.json";

/**
 * Level 3: verified_at の鮮度チェック
 *
 * 全 citations の verified_at が6ヶ月以内であることを確認。
 * - 6ヶ月超〜1年以内: コンソール警告
 * - 1年超: テスト失敗
 */

interface Citation {
  url: string;
  verified_at: string;
  source?: string;
  number?: string;
  title?: string;
}

function collectCitations(): { label: string; citation: Citation }[] {
  const results: { label: string; citation: Citation }[] = [];

  for (const rule of rules) {
    for (const c of (rule as { citations: Citation[] }).citations) {
      results.push({ label: `rule ${rule.id}: ${rule.name}`, citation: c });
    }
  }
  for (const acc of accounts) {
    for (const c of (acc as { citations: Citation[] }).citations) {
      results.push({ label: `account ${acc.id}: ${acc.name}`, citation: c });
    }
  }

  return results;
}

describe("Level 3: citation verified_at should be within 6 months", () => {
  const citations = collectCitations();
  const now = new Date();
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  it.each(citations)("$label — verified_at: $citation.verified_at", ({ label, citation }) => {
    const verifiedAt = new Date(citation.verified_at);
    expect(verifiedAt.toString()).not.toBe("Invalid Date");

    // 1年超 → テスト失敗
    expect(
      verifiedAt >= oneYearAgo,
      `${label}: verified_at (${citation.verified_at}) is older than 1 year`,
    ).toBe(true);

    // 6ヶ月超〜1年以内 → 警告
    if (verifiedAt < sixMonthsAgo) {
      console.warn(
        `[WARNING] ${label}: verified_at (${citation.verified_at}) is older than 6 months. Consider re-verifying.`,
      );
    }
  });
});
