/**
 * docs/sources.md を JSON データから自動生成するスクリプト
 *
 * Usage: npx tsx scripts/generate-sources.ts
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

interface Citation {
  source: string;
  number: string;
  title: string;
  url: string;
  verified_at: string;
}

interface Rule {
  id: string;
  name: string;
  citations: Citation[];
}

interface Account {
  id: number;
  name: string;
  citations: Citation[];
}

interface Threshold {
  id: string;
  rule: string;
  sourceUrl: string;
}

const rules: Rule[] = JSON.parse(readFileSync(resolve(root, "rules/journal-rules.json"), "utf-8"));
const accounts: Account[] = JSON.parse(readFileSync(resolve(root, "rules/account-master.json"), "utf-8"));
const thresholds: Threshold[] = JSON.parse(readFileSync(resolve(root, "rules/amount-thresholds.json"), "utf-8"));

// 全citationsを収集してユニークURL順に整理
const allCitations = new Map<string, { citation: Citation; usedBy: string[] }>();

for (const rule of rules) {
  for (const c of rule.citations) {
    const key = c.url;
    if (!allCitations.has(key)) {
      allCitations.set(key, { citation: c, usedBy: [] });
    }
    allCitations.get(key)!.usedBy.push(`ルール: ${rule.name} (${rule.id})`);
  }
}

for (const acc of accounts) {
  for (const c of acc.citations) {
    const key = c.url;
    if (!allCitations.has(key)) {
      allCitations.set(key, { citation: c, usedBy: [] });
    }
    allCitations.get(key)!.usedBy.push(`科目: ${acc.name}`);
  }
}

for (const t of thresholds) {
  if (t.sourceUrl) {
    const key = t.sourceUrl;
    if (!allCitations.has(key)) {
      allCitations.set(key, { citation: { source: "国税庁", number: "", title: "", url: t.sourceUrl, verified_at: "2026-04-02" }, usedBy: [] });
    }
    allCitations.get(key)!.usedBy.push(`閾値: ${t.rule} (${t.id})`);
  }
}

// Markdown生成
let md = `# 根拠URL一覧

> このファイルは \`npx tsx scripts/generate-sources.ts\` で自動生成されています。
> 手動で編集しないでください。

全ルールは国税庁等の公式ドキュメントに基づいています。

## 根拠一覧

| # | 出典 | 番号 | タイトル | URL | 使用箇所数 |
|---|------|------|---------|-----|:----------:|
`;

let i = 1;
for (const [url, { citation, usedBy }] of allCitations) {
  md += `| ${i} | ${citation.source} | ${citation.number} | ${citation.title} | [リンク](${url}) | ${usedBy.length} |\n`;
  i++;
}

md += `\n## 使用箇所の詳細\n\n`;

for (const [url, { citation, usedBy }] of allCitations) {
  md += `### ${citation.number || citation.source}: ${citation.title || url}\n\n`;
  for (const u of usedBy) {
    md += `- ${u}\n`;
  }
  md += `\n`;
}

md += `---\n\n*最終生成: ${new Date().toISOString().split("T")[0]}*\n`;

writeFileSync(resolve(root, "docs/sources.md"), md);
console.log(`Generated docs/sources.md (${allCitations.size} unique sources, ${i - 1} entries)`);
