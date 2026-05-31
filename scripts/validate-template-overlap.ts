/**
 * テンプレートと本体ルールの完全重複パターン衝突を検証するスクリプト
 *
 * 同一 pattern が テンプレート と 本体ルール で異なる accountName を持つ場合に
 * 非0終了する。衝突がなければ 0 終了。
 *
 * Usage: npx tsx scripts/validate-template-overlap.ts
 */

import { readFileSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

interface Rule {
  id: string;
  name: string;
  patterns: string[];
  accountName: string;
}

interface TemplateRule {
  id: string;
  name: string;
  patterns: string[];
  accountName: string;
}

function loadJsonArray<T>(filePath: string): T[] {
  const raw = readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as T[];
}

function main(): void {
  // 本体ルールを読み込む
  const mainRules = loadJsonArray<Rule>(
    resolve(root, "rules", "journal-rules.json")
  );

  // 本体ルールの pattern -> accountName マップを構築
  const mainPatternMap = new Map<string, string>();
  for (const rule of mainRules) {
    for (const pattern of rule.patterns) {
      mainPatternMap.set(pattern, rule.accountName);
    }
  }

  // テンプレートディレクトリのすべての JSON を読み込む
  const templatesDir = resolve(root, "rules", "templates");
  const templateFiles = readdirSync(templatesDir).filter((f) =>
    f.endsWith(".json")
  );

  const conflicts: Array<{
    templateFile: string;
    templateRuleId: string;
    pattern: string;
    templateAccountName: string;
    mainAccountName: string;
  }> = [];

  for (const fileName of templateFiles) {
    const filePath = resolve(templatesDir, fileName);
    const templateRules = loadJsonArray<TemplateRule>(filePath);

    for (const tmplRule of templateRules) {
      for (const pattern of tmplRule.patterns) {
        const mainAccountName = mainPatternMap.get(pattern);
        if (
          mainAccountName !== undefined &&
          mainAccountName !== tmplRule.accountName
        ) {
          conflicts.push({
            templateFile: fileName,
            templateRuleId: tmplRule.id,
            pattern,
            templateAccountName: tmplRule.accountName,
            mainAccountName,
          });
        }
      }
    }
  }

  if (conflicts.length === 0) {
    console.log(
      "✅ テンプレートと本体ルールに完全重複パターンの accountName 衝突はありません。"
    );
    process.exit(0);
  } else {
    console.error(
      `❌ ${conflicts.length} 件の衝突が検出されました:\n`
    );
    for (const c of conflicts) {
      console.error(
        `  ファイル: ${c.templateFile}  ルール: ${c.templateRuleId}  パターン: "${c.pattern}"`
      );
      console.error(
        `    テンプレート側 accountName: "${c.templateAccountName}"  本体側 accountName: "${c.mainAccountName}"`
      );
    }
    process.exit(1);
  }
}

main();
