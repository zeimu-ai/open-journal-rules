/**
 * B-15: パターン衝突検出テスト
 *
 * journal-rules.json と templates/*.json を全て読み込み、
 * 以下の2種類の衝突を検出する:
 *
 * 【fail条件】
 *   同一の完全一致 pattern が異なる accountName または異なる taxCategory を持つ
 *   ルール間に存在する場合 → expect.fail で検出
 *
 * 【warn条件(failしない)】
 *   ある pattern が別ルールの pattern の部分文字列で、
 *   accountName/taxCategory が異なる場合 → console.warn で列挙
 */

import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** ルールの最小型定義 (JSON import 不使用・引数で受け取る) */
interface RuleEntry {
  id: string;
  name: string;
  patterns: string[];
  accountName: string;
  taxCategory: string;
}

/** パターンに対応するルール情報 */
interface PatternRef {
  ruleId: string;
  ruleName: string;
  accountName: string;
  taxCategory: string;
  sourceFile: string;
}

/** 全ルールを読み込む (journal-rules.json + templates/*.json) */
function loadAllRules(): RuleEntry[] {
  const rulesDir = join(__dirname, "../rules");
  const journalRulesPath = join(rulesDir, "journal-rules.json");
  const templatesDir = join(rulesDir, "templates");

  const baseRules: RuleEntry[] = JSON.parse(
    readFileSync(journalRulesPath, "utf-8"),
  ) as RuleEntry[];

  const templateFiles = readdirSync(templatesDir)
    .filter((f) => f.endsWith(".json"))
    .sort();

  const templateRules: RuleEntry[] = templateFiles.flatMap((fname) => {
    const raw = readFileSync(join(templatesDir, fname), "utf-8");
    return JSON.parse(raw) as RuleEntry[];
  });

  return [...baseRules, ...templateRules];
}

/** パターン → PatternRef[] のマップを構築する */
function buildPatternMap(
  rules: RuleEntry[],
  sourceLabel: (rule: RuleEntry) => string,
): Map<string, PatternRef[]> {
  const map = new Map<string, PatternRef[]>();

  for (const rule of rules) {
    for (const pattern of rule.patterns) {
      if (!map.has(pattern)) {
        map.set(pattern, []);
      }
      map.get(pattern)!.push({
        ruleId: rule.id,
        ruleName: rule.name,
        accountName: rule.accountName,
        taxCategory: rule.taxCategory,
        sourceFile: sourceLabel(rule),
      });
    }
  }

  return map;
}

/** 完全一致衝突 (accountName または taxCategory が異なる) を検出する */
function detectExactCollisions(
  patternMap: Map<string, PatternRef[]>,
): Array<{ pattern: string; refs: PatternRef[] }> {
  const collisions: Array<{ pattern: string; refs: PatternRef[] }> = [];

  for (const [pattern, refs] of patternMap.entries()) {
    if (refs.length <= 1) continue;

    const accountNames = new Set(refs.map((r) => r.accountName));
    const taxCategories = new Set(refs.map((r) => r.taxCategory));

    if (accountNames.size > 1 || taxCategories.size > 1) {
      collisions.push({ pattern, refs });
    }
  }

  return collisions;
}

/** 部分文字列衝突 (accountName または taxCategory が異なる) を検出してwarnで列挙する */
function warnSubstringCollisions(
  patternMap: Map<string, PatternRef[]>,
): void {
  const patterns = Array.from(patternMap.keys());
  const warnMessages: string[] = [];

  for (const shorter of patterns) {
    for (const longer of patterns) {
      // 自分自身はスキップ、shorter が longer の真部分文字列かチェック
      if (shorter === longer) continue;
      if (!longer.includes(shorter)) continue;

      const refsForShorter = patternMap.get(shorter)!;
      const refsForLonger = patternMap.get(longer)!;

      for (const rs of refsForShorter) {
        for (const rl of refsForLonger) {
          if (
            rs.accountName !== rl.accountName ||
            rs.taxCategory !== rl.taxCategory
          ) {
            warnMessages.push(
              `[WARN] substr-collision: "${shorter}" ⊂ "${longer}" | ` +
                `${rs.ruleId}(${rs.ruleName}, ${rs.accountName}, ${rs.taxCategory}) vs ` +
                `${rl.ruleId}(${rl.ruleName}, ${rl.accountName}, ${rl.taxCategory})`,
            );
          }
        }
      }
    }
  }

  // 重複排除して列挙 (同じペアが双方向でヒットしないよう)
  const unique = [...new Set(warnMessages)];
  for (const msg of unique) {
    console.warn(msg);
  }

  if (unique.length > 0) {
    console.warn(
      `[B-15] 部分文字列 priority/exclude 検討候補: ${unique.length} 件 (テストは落とさない)`,
    );
  }
}

describe("B-15: パターン衝突検出", () => {
  const allRules = loadAllRules();

  // sourceFile は id をそのまま使う (テスト内で一意識別できれば十分)
  const patternMap = buildPatternMap(allRules, (r) => r.id);

  it("journal-rules.json と templates/*.json が正常にロードできること", () => {
    expect(allRules.length).toBeGreaterThan(0);
  });

  it("全ルールの patterns が1件以上あること", () => {
    for (const rule of allRules) {
      expect(
        rule.patterns.length,
        `${rule.id} (${rule.name}) の patterns が空`,
      ).toBeGreaterThan(0);
    }
  });

  it("完全一致 pattern で accountName/taxCategory が異なる衝突が存在しないこと", () => {
    const collisions = detectExactCollisions(patternMap);

    if (collisions.length > 0) {
      const detail = collisions
        .map(({ pattern, refs }) => {
          const lines = refs.map(
            (r) =>
              `  ${r.ruleId} (${r.ruleName}): accountName="${r.accountName}", taxCategory="${r.taxCategory}"`,
          );
          return `pattern "${pattern}":\n${lines.join("\n")}`;
        })
        .join("\n\n");

      expect.fail(
        `完全一致パターン衝突が ${collisions.length} 件検出されました:\n\n${detail}`,
      );
    }

    expect(collisions.length).toBe(0);
  });

  it("部分文字列衝突を console.warn で列挙する (テストは落とさない)", () => {
    // warnを発火させるが、テストは必ずpassする
    warnSubstringCollisions(patternMap);
    expect(true).toBe(true);
  });
});
