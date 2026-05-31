/**
 * 統合解決API
 *
 * 摘要文字列と金額を受け取り、journal-rules のマッチング結果に
 * amount-thresholds.json の閾値ルールを組み合わせて ResolveResult を返す。
 *
 * 設計方針:
 * - match() でベストマッチを取得し accountName / taxCategory / confidence を決定
 * - amount が amount-thresholds の範囲に該当する場合、thresholdRule に該当ルールの rule 文言を付加
 * - 科目の上書きは行わない（情報付加のみ）
 */
import { match, MatchRule } from "./matcher";
import thresholdsRaw from "../rules/amount-thresholds.json";

/** amount-thresholds.json の各エントリの型 */
interface ThresholdEntry {
  id: string;
  rule: string;
  sourceUrl: string;
  notes: string;
  minAmount?: number;
  maxAmount?: number;
}

/** 型安全なキャスト: amount-thresholds.json は配列として読み込まれる */
const thresholds = thresholdsRaw as ThresholdEntry[];

/** resolveJournalEntry の返り値型 */
export interface ResolveResult {
  /** マッチした勘定科目名。マッチなしは null */
  accountName: string | null;
  /** マッチした税区分。マッチなしは null */
  taxCategory: string | null;
  /** マッチしたルールID。マッチなしは null */
  matchedRuleId: string | null;
  /** 信頼度スコア (0.0 〜 1.0)。マッチなしは 0 */
  confidence: number;
  /** 金額が閾値に該当する場合の閾値ルール文言 (省略可) */
  thresholdRule?: string;
}

/**
 * 摘要と金額から仕訳エントリを解決する。
 *
 * @param description - 照合対象の摘要文字列
 * @param amount      - 取引金額（円）
 * @param rules       - 照合するルール配列 (MatchRule[])
 * @returns ResolveResult
 */
export function resolveJournalEntry(
  description: string,
  amount: number,
  rules: MatchRule[]
): ResolveResult {
  // 1. match() でベストマッチを取得
  const matchResults = match(description, rules);
  const best = matchResults.length > 0 ? matchResults[0] : null;

  // 2. マッチなしの場合
  if (best === null) {
    return {
      accountName: null,
      taxCategory: null,
      matchedRuleId: null,
      confidence: 0,
    };
  }

  // 3. 金額に対応する閾値ルールを検索
  // 優先順位: 配列に登場する順番で最初にマッチしたエントリを採用
  // (amount-thresholds.json は threshold-01〜05 が資産耐用年数系、
  //  threshold-06以降がカテゴリ専用系として並んでいる)
  let matchedThreshold: ThresholdEntry | null = null;

  for (const entry of thresholds) {
    const hasMin = entry.minAmount !== undefined;
    const hasMax = entry.maxAmount !== undefined;

    // 範囲チェック
    const aboveMin = hasMin ? amount >= (entry.minAmount as number) : true;
    const belowMax = hasMax ? amount < (entry.maxAmount as number) : true;

    if (aboveMin && belowMax) {
      matchedThreshold = entry;
      break; // 最初にマッチしたエントリを使用
    }
  }

  // 4. 結果を構築
  const result: ResolveResult = {
    accountName: best.rule.accountName,
    taxCategory: best.rule.taxCategory,
    matchedRuleId: best.rule.id,
    confidence: best.rule.confidence,
  };

  if (matchedThreshold !== null) {
    result.thresholdRule = matchedThreshold.rule;
  }

  return result;
}
