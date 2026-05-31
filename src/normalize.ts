/**
 * 文字列正規化ユーティリティ
 *
 * NFKC 正規化 + 小文字化 + 前後空白除去を行う。
 * 全角英数字は半角に統一されるため、表記揺れを吸収できる。
 * ただし英字表記とカナ表記（例: "uq mobile" と "uqモバイル"）は
 * 正規化後も別文字列として残る点に注意。
 */

/**
 * テキストを正規化する。
 * - Unicode NFKC 正規化（全角英数 → 半角 等）
 * - 小文字化
 * - 前後空白除去
 */
export function normalizeText(s: string): string {
  return s.normalize("NFKC").toLowerCase().trim();
}
