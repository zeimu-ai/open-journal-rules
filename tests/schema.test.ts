import { describe, it, expect } from "vitest";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import rules from "../rules/journal-rules.json";
import accounts from "../rules/account-master.json";
import thresholds from "../rules/amount-thresholds.json";
import ruleSchema from "../schemas/journal-rule.schema.json";
import accountSchema from "../schemas/account-item.schema.json";
import thresholdSchema from "../schemas/amount-threshold.schema.json";

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
});
