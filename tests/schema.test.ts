import { describe, it, expect } from "vitest";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import rulesRaw from "../rules/journal-rules.json";
import accountsRaw from "../rules/account-master.json";
import thresholds from "../rules/amount-thresholds.json";
import ruleSchema from "../schemas/journal-rule.schema.json";
import accountSchema from "../schemas/account-item.schema.json";
import thresholdSchema from "../schemas/amount-threshold.schema.json";
import socialInsuranceRaw from "../rules/social-insurance-rates.json";
import withholdingRaw from "../rules/withholding-tax-rates.json";
import socialInsuranceSchema from "../schemas/social-insurance-rate.schema.json";
import withholdingSchema from "../schemas/withholding-tax-rate.schema.json";
import gradesRaw from "../rules/standard-remuneration-grades.json";
import filingRaw from "../rules/filing-deadlines.json";
import gradesSchema from "../schemas/standard-remuneration-grade.schema.json";
import filingSchema from "../schemas/filing-deadline.schema.json";

interface RuleEntry {
  id: string;
  name: string;
  [key: string]: unknown;
}

interface AccountEntry {
  id: string;
  name: string;
  [key: string]: unknown;
}

const rules = rulesRaw as unknown as RuleEntry[];
const accounts = accountsRaw as unknown as AccountEntry[];

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

describe("JSON Schema validation", () => {
  describe("journal-rules.json", () => {
    const validate = ajv.compile(ruleSchema);

    it("全ルールがスキーマに適合すること", () => {
      const errors: string[] = [];
      for (const rule of rules) {
        const valid = validate(rule);
        if (!valid) {
          errors.push(
            `${rule.id} ${rule.name}: ${validate.errors?.map((e) => `${e.instancePath} ${e.message}`).join(", ")}`,
          );
        }
      }
      if (errors.length > 0) {
        expect.fail(`スキーマ違反:\n${errors.join("\n")}`);
      }
    });
  });

  describe("templates/*.json", () => {
    const validate = ajv.compile(ruleSchema);
    const templatesDir = new URL("../rules/templates/", import.meta.url).pathname;
    const templateFiles = readdirSync(templatesDir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => join(templatesDir, f));

    it(`テンプレートファイルが29件存在すること`, () => {
      const totalEntries = templateFiles.flatMap((f) => {
        const data = JSON.parse(readFileSync(f, "utf-8")) as unknown[];
        return data;
      });
      expect(totalEntries.length).toBe(29);
    });

    it("全テンプレートエントリ(29件)がスキーマに適合すること", () => {
      const errors: string[] = [];
      for (const f of templateFiles) {
        const entries = JSON.parse(readFileSync(f, "utf-8")) as Array<{
          id: string;
          name: string;
        }>;
        for (const entry of entries) {
          const { id, name } = entry;
          const valid = validate(entry);
          if (!valid) {
            errors.push(
              `${id} ${name}: ${validate.errors?.map((e) => `${e.instancePath} ${e.message}`).join(", ")}`,
            );
          }
        }
      }
      if (errors.length > 0) {
        expect.fail(`テンプレート スキーマ違反:\n${errors.join("\n")}`);
      }
    });
  });

  describe("account-master.json", () => {
    const validate = ajv.compile(accountSchema);

    it("全勘定科目がスキーマに適合すること", () => {
      const errors: string[] = [];
      for (const acc of accounts) {
        const valid = validate(acc);
        if (!valid) {
          errors.push(
            `${acc.id} ${acc.name}: ${validate.errors?.map((e) => `${e.instancePath} ${e.message}`).join(", ")}`,
          );
        }
      }
      if (errors.length > 0) {
        expect.fail(`スキーマ違反:\n${errors.join("\n")}`);
      }
    });
  });

  describe("amount-thresholds.json", () => {
    const validate = ajv.compile(thresholdSchema);

    it("全閾値がスキーマに適合すること", () => {
      const errors: string[] = [];
      for (const t of thresholds) {
        const valid = validate(t);
        if (!valid) {
          errors.push(
            `${t.id}: ${validate.errors?.map((e) => `${e.instancePath} ${e.message}`).join(", ")}`,
          );
        }
      }
      if (errors.length > 0) {
        expect.fail(`スキーマ違反:\n${errors.join("\n")}`);
      }
    });
  });

  describe("social-insurance-rates.json", () => {
    const validate = ajv.compile(socialInsuranceSchema);
    it("社会保険料率データセットがスキーマに適合すること", () => {
      const valid = validate(socialInsuranceRaw);
      if (!valid) {
        expect.fail(
          `スキーマ違反:\n${validate.errors?.map((e) => `${e.instancePath} ${e.message}`).join("\n")}`,
        );
      }
    });
  });

  describe("withholding-tax-rates.json", () => {
    const validate = ajv.compile(withholdingSchema);
    it("源泉徴収データセットがスキーマに適合すること", () => {
      const valid = validate(withholdingRaw);
      if (!valid) {
        expect.fail(
          `スキーマ違反:\n${validate.errors?.map((e) => `${e.instancePath} ${e.message}`).join("\n")}`,
        );
      }
    });
  });

  describe("standard-remuneration-grades.json", () => {
    const validate = ajv.compile(gradesSchema);
    it("標準報酬月額等級表がスキーマに適合すること", () => {
      const valid = validate(gradesRaw);
      if (!valid) {
        expect.fail(
          `スキーマ違反:\n${validate.errors?.map((e) => `${e.instancePath} ${e.message}`).join("\n")}`,
        );
      }
    });
  });

  describe("filing-deadlines.json", () => {
    const validate = ajv.compile(filingSchema);
    it("申告・納付期限データセットがスキーマに適合すること", () => {
      const valid = validate(filingRaw);
      if (!valid) {
        expect.fail(
          `スキーマ違反:\n${validate.errors?.map((e) => `${e.instancePath} ${e.message}`).join("\n")}`,
        );
      }
    });
  });
});
