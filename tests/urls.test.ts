import { describe, it, expect } from "vitest";
import rules from "../rules/journal-rules.json";
import accounts from "../rules/account-master.json";
import thresholds from "../rules/amount-thresholds.json";

/**
 * Level 2: citation URLの生存確認テスト
 *
 * 全ルール・科目・閾値の citations[].url に HTTP HEAD リクエストを送信し、
 * ステータス200が返ることを確認する。
 *
 * 環境変数 SKIP_URL_CHECK=1 で無効化可能（CI用）。
 */

const SKIP = process.env.SKIP_URL_CHECK === "1";

function collectCitationUrls(): { label: string; url: string }[] {
  const urls: { label: string; url: string }[] = [];

  for (const rule of rules) {
    for (const c of (rule as { citations: { url: string }[] }).citations) {
      if (c.url) urls.push({ label: `rule ${rule.id}: ${rule.name}`, url: c.url });
    }
  }
  for (const acc of accounts) {
    for (const c of (acc as { citations: { url: string }[] }).citations) {
      if (c.url) urls.push({ label: `account ${acc.id}: ${acc.name}`, url: c.url });
    }
  }
  for (const t of thresholds) {
    if (t.sourceUrl) {
      urls.push({ label: `threshold ${t.id}`, url: t.sourceUrl });
    }
  }

  // 重複URL除去（同じURLを複数回チェックしない）
  const seen = new Set<string>();
  return urls.filter((u) => {
    if (seen.has(u.url)) return false;
    seen.add(u.url);
    return true;
  });
}

describe.skipIf(SKIP)("Level 2: citation URLs should be accessible", () => {
  const urls = collectCitationUrls();

  it.each(urls)("$url ($label)", async ({ url }) => {
    const res = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(10_000),
    });
    expect(res.status).toBe(200);
  }, 15_000);
});
