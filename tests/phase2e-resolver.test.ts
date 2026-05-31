import { describe, it, expect } from "vitest";
import rulesRaw from "../rules/journal-rules.json";
import { resolveJournalEntry } from "../src/resolver";
import type { MatchRule } from "../src/matcher";

const rules = rulesRaw as unknown as MatchRule[];

/**
 * Phase2E #34: 金額×科目の交互作用。
 * 消耗品費にマッチしても金額が10万円以上なら資産計上(工具器具備品)を suggestedAccountName で提案する（科目自体は上書きしない=後方互換）。
 */
describe("Phase2E #34 金額に応じた資産科目サジェスト", () => {
  it("消耗品費 × 10万円以上 → suggestedAccountName=工具器具備品 + thresholdRule", () => {
    const r = resolveJournalEntry("Amazon 事務用品 購入", 150000, rules);
    expect(r.accountName).toBe("消耗品費");
    expect(r.suggestedAccountName).toBe("工具器具備品");
    expect(r.thresholdRule).toBeDefined();
  });

  it("消耗品費 × 10万円未満 → suggestedAccountName は付かない(全額経費)", () => {
    const r = resolveJournalEntry("Amazon 事務用品 購入", 3000, rules);
    expect(r.accountName).toBe("消耗品費");
    expect(r.suggestedAccountName).toBeUndefined();
  });

  it("資産非関連の科目(通信費等)には suggestedAccountName を付けない", () => {
    const r = resolveJournalEntry("NTT 固定電話 5月分", 150000, rules);
    expect(r.accountName).toBe("通信費");
    expect(r.suggestedAccountName).toBeUndefined();
  });

  it("境界値: ちょうど10万円 → 提案あり(threshold-01は未満境界のため一括償却資産帯域に入る)", () => {
    const r = resolveJournalEntry("Amazon 事務用品 購入", 100000, rules);
    expect(r.suggestedAccountName).toBe("工具器具備品");
    expect(r.thresholdRule).toContain("一括償却資産");
  });

  it("境界値: 99,999円 → 提案なし(全額経費の帯域)", () => {
    const r = resolveJournalEntry("Amazon 事務用品 購入", 99999, rules);
    expect(r.suggestedAccountName).toBeUndefined();
  });
});
