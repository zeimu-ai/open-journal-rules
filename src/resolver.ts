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
  /** 閾値カテゴリ。汎用の金額→処理判定には asset_acquisition のみ使用する */
  category?: string;
  /** maxAmount を含む(以下)か。未指定は exclusive(未満) */
  inclusive?: boolean;
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
  /**
   * 金額×科目の交互作用による資産科目の提案 (省略可)。
   * 例: 消耗品費にマッチしても取得価額が10万円以上の場合、資産計上(工具器具備品)を提案する。
   * accountName 自体は上書きしない（後方互換）。最終判断は消費者側に委ねる情報付加。
   */
  suggestedAccountName?: string;
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
  //   asset_acquisition カテゴリ(threshold-01〜05)のみを「金額→資産処理」判定に使う。
  //   repair(修繕費)/meeting(会議費)カテゴリは勘定科目の文脈に依存するため汎用パスから除外する。
  //   さらに、資産取得の閾値は購入資産系の科目(消耗品費 等)でのみ意味を持つため、
  //   該当科目にマッチした場合のみ閾値を付加する(通信費/会議費等への誤付与を防止)。
  //   asset_acquisition の各閾値は「未満」境界(exclusive)なので belowMax は amount < maxAmount。
  const ASSET_RELEVANT_ACCOUNTS = new Set(["消耗品費"]);
  const assetThresholds = ASSET_RELEVANT_ACCOUNTS.has(best.rule.accountName)
    ? thresholds.filter((t) => t.category === "asset_acquisition")
    : [];
  let matchedThreshold: ThresholdEntry | null = null;

  for (const entry of assetThresholds) {
    const hasMin = entry.minAmount !== undefined;
    const hasMax = entry.maxAmount !== undefined;

    const aboveMin = hasMin ? amount >= (entry.minAmount as number) : true;
    const belowMax = hasMax
      ? entry.inclusive
        ? amount <= (entry.maxAmount as number)
        : amount < (entry.maxAmount as number)
      : true;

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
    // 金額×科目の交互作用: 資産取得閾値のうち下限が10万円以上の帯域(=一括償却資産以上)に
    // 該当した場合、資産計上科目(工具器具備品)を提案する。10万円未満(全額経費)では提案しない。
    // 提案科目は帯域(一括償却資産10〜20万/少額減価償却資産20〜30万/固定資産30万〜)によらず
    // 一律「工具器具備品」に一本化する意図的設計。具体的な償却方法・特例の別は thresholdRule
    // に帯域別の文言が乗るため、消費者側はそちらで判断できる。
    if (matchedThreshold.minAmount !== undefined && matchedThreshold.minAmount >= 100000) {
      result.suggestedAccountName = "工具器具備品";
    }
  }

  return result;
}
