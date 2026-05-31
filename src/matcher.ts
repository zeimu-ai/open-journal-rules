/**
 * 正典マッチャー
 *
 * journal-rules.json のルール群に対して説明文字列をマッチングし、
 * 最適なルール候補を優先度付きで返す。
 *
 * ソート基準:
 *   1. priority (降順、未指定 = 0)
 *   2. matchedPattern.length (降順: longest-match)
 *   3. confidence (降順)
 */
import { normalizeText } from "./normalize";

/** マッチングルールの型定義 (journal-rules.json の構造と互換) */
export interface MatchRule {
  id: string;
  name: string;
  patterns: string[];
  matchType: "exact" | "prefix" | "partial";
  accountName: string;
  taxCategory: string;
  confidence: number;
  /** 優先度 (省略時 = 0)。値が大きいほど優先 */
  priority?: number;
  /** これらの文字列が説明文に含まれていた場合、このルールを除外する */
  excludePatterns?: string[];
  // journal-rules.json に存在するその他フィールドは任意
  [key: string]: unknown;
}

/** マッチング結果の型定義 */
export interface MatchResult {
  rule: MatchRule;
  /** マッチした patterns エントリ（normalizeText 済み） */
  matchedPattern: string;
  /**
   * 相対スコア = matchedPattern.length * confidence（ルール単体の関連度ヒューリスティック）。
   * 注意: 最終順位は priority → matchedPattern.length → confidence で決まり score は順位に直接使わない。
   * 呼び出し側はソート済み配列の先頭(results[0])をベストマッチとして使うこと（score の最大値ではない）。
   */
  score: number;
}

/**
 * description を rules に対してマッチングし、ソート済み MatchResult[] を返す。
 *
 * @param description - 照合対象の説明文字列（摘要等）
 * @param rules       - 照合対象のルール配列
 * @returns マッチしたルールの配列（ベストマッチが先頭）
 */
export function match(description: string, rules: MatchRule[]): MatchResult[] {
  const normalizedDesc = normalizeText(description);
  const results: MatchResult[] = [];

  for (const rule of rules) {
    // excludePatterns チェック: 正規化後の説明文に除外パターンが含まれたらスキップ
    if (rule.excludePatterns && rule.excludePatterns.length > 0) {
      const shouldExclude = rule.excludePatterns.some((ep) =>
        normalizedDesc.includes(normalizeText(ep))
      );
      if (shouldExclude) continue;
    }

    // patterns をマッチング: 最長マッチを選ぶ
    let bestPattern: string | null = null;
    let bestPatternLength = 0;

    for (const pattern of rule.patterns) {
      const normalizedPattern = normalizeText(pattern);
      let matched = false;

      switch (rule.matchType) {
        case "exact":
          matched = normalizedDesc === normalizedPattern;
          break;
        case "prefix":
          matched = normalizedDesc.startsWith(normalizedPattern);
          break;
        case "partial":
          matched = normalizedDesc.includes(normalizedPattern);
          break;
      }

      if (matched && normalizedPattern.length > bestPatternLength) {
        bestPattern = normalizedPattern;
        bestPatternLength = normalizedPattern.length;
      }
    }

    if (bestPattern !== null) {
      const score = bestPatternLength * rule.confidence;
      results.push({
        rule,
        matchedPattern: bestPattern,
        score,
      });
    }
  }

  // ソート: priority(降順) → matchedPattern.length(降順) → confidence(降順)
  results.sort((a, b) => {
    const priorityA = a.rule.priority ?? 0;
    const priorityB = b.rule.priority ?? 0;
    if (priorityB !== priorityA) return priorityB - priorityA;

    const lenDiff = b.matchedPattern.length - a.matchedPattern.length;
    if (lenDiff !== 0) return lenDiff;

    return b.rule.confidence - a.rule.confidence;
  });

  return results;
}
