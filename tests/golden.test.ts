/**
 * B-23: ゴールデンコーパス精度計測テスト (matcher.ts 使用版)
 *
 * - src/matcher.ts の match() を使い、本体 rules + templates/*.json を結合した
 *   ルール配列に対してコーパスを評価する。
 * - accountName precision の回帰ガード: >= 0.75 (現到達水準)
 *   将来目標 0.95 は追加ルール整備後に段階的に引き上げる。
 */
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { match, MatchRule } from "../src/matcher";
import corpus from "./golden/mini-corpus.json";

type CorpusEntry = {
  input: string;
  expectedAccountName: string;
  expectedTaxCategory: string;
};

/** 本体ルール + templates/*.json を結合して返す */
function loadAllRules(): MatchRule[] {
  const rulesDir = join(__dirname, "..", "rules");

  // 本体ルール
  const mainRulesPath = join(rulesDir, "journal-rules.json");
  const mainRules = JSON.parse(
    readFileSync(mainRulesPath, "utf-8")
  ) as MatchRule[];

  // templates/*.json
  const templatesDir = join(rulesDir, "templates");
  const templateFiles = readdirSync(templatesDir).filter((f: string) =>
    f.endsWith(".json")
  );

  const templateRules: MatchRule[] = [];
  for (const file of templateFiles) {
    const filePath = join(templatesDir, file);
    const rules = JSON.parse(readFileSync(filePath, "utf-8")) as MatchRule[];
    templateRules.push(...rules);
  }

  return [...mainRules, ...templateRules];
}

describe("golden matcher (B-23)", () => {
  const allRules = loadAllRules();

  it("コーパスが50件以上であること", () => {
    expect((corpus as CorpusEntry[]).length).toBeGreaterThanOrEqual(50);
  });

  it("accountName precision >= 0.75 (回帰ガード / 将来目標 0.95)", () => {
    let accountNameMatch = 0;
    let taxCategoryMatch = 0;
    let unmatchedCount = 0;
    const total = (corpus as CorpusEntry[]).length;

    const failures: { input: string; expected: string; got: string | null }[] =
      [];

    for (const entry of corpus as CorpusEntry[]) {
      const results = match(entry.input, allRules);
      const best = results[0] ?? null;

      if (best === null) {
        unmatchedCount++;
        failures.push({
          input: entry.input,
          expected: entry.expectedAccountName,
          got: null,
        });
        continue;
      }

      if (best.rule.accountName === entry.expectedAccountName) {
        accountNameMatch++;
      } else {
        failures.push({
          input: entry.input,
          expected: entry.expectedAccountName,
          got: best.rule.accountName,
        });
      }

      if (best.rule.taxCategory === entry.expectedTaxCategory) {
        taxCategoryMatch++;
      }
    }

    const accountNamePrecision = accountNameMatch / total;
    const taxCategoryPrecision = taxCategoryMatch / total;

    console.log(
      `[golden matcher] accountName precision: ${accountNameMatch}/${total} (${(accountNamePrecision * 100).toFixed(1)}%)`
    );
    console.log(
      `[golden matcher] taxCategory precision: ${taxCategoryMatch}/${total} (${(taxCategoryPrecision * 100).toFixed(1)}%)`
    );
    console.log(
      `[golden matcher] unmatched: ${unmatchedCount}/${total} (${((unmatchedCount / total) * 100).toFixed(1)}%)`
    );

    if (failures.length > 0) {
      console.log("[golden matcher] failures (accountName mismatch or unmatched):");
      for (const f of failures) {
        console.log(
          `  input="${f.input}" | expected="${f.expected}" | got="${f.got ?? "(unmatched)"}"`
        );
      }
    }

    // 回帰ガード: 0.75 以上を維持すること
    // 将来目標は 0.95 (ルール拡充後に段階的に引き上げる)
    expect(accountNamePrecision).toBeGreaterThanOrEqual(0.75);
  });
});
