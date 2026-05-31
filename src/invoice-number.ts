/**
 * 適格請求書発行事業者の登録番号ユーティリティ
 *
 * 登録番号は「T」+ 13桁の数字。13桁は法人の場合は法人番号、
 * 個人事業者・人格のない社団等の場合は法人番号と重複しない13桁の数字。
 * OCRで抽出した請求書・領収書テキストからの登録番号検出・検証に用いる。
 *
 * 参考: 国税庁「適格請求書発行事業者公表サイト」/ 法人番号の検査用数字の算定方法。
 */

/** 登録番号(T+13桁)の形式に合致するか */
export function isInvoiceRegistrationNumberFormat(s: string): boolean {
  return /^T\d{13}$/.test(s.trim());
}

/**
 * テキスト(OCR結果等)から登録番号らしき文字列(T+13桁)を抽出する。
 * 重複は除去して返す。
 */
export function extractInvoiceRegistrationNumbers(text: string): string[] {
  // 前後が数字の場合はマッチしない(T+14桁等のOCRノイズから先頭13桁を誤抽出しないため)
  const matches = text.match(/(?<!\d)T\d{13}(?!\d)/g);
  return matches ? Array.from(new Set(matches)) : [];
}

/**
 * 13桁の法人番号の検査用数字(先頭1桁)を検証する。
 * 検査用数字 = 9 −（基礎番号12桁の各桁 Pn × Qn の総和 を 9 で除した余り）。
 * Pn は基礎番号の最下位桁を1番目とした n 桁目、Qn は n が奇数なら1・偶数なら2。
 * (個人事業者等の13桁は法人番号ではないためチェックディジットは保証されない)
 */
export function isValidCorporateNumber(num13: string): boolean {
  if (!/^\d{13}$/.test(num13)) return false;
  const checkDigit = Number(num13[0]);
  const base = num13.slice(1); // 基礎番号12桁
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = Number(base[11 - i]); // 最下位から
    const weight = i % 2 === 0 ? 1 : 2; // n=i+1 が奇数→1, 偶数→2
    sum += digit * weight;
  }
  return checkDigit === 9 - (sum % 9);
}

/** 登録番号の検証結果 */
export interface InvoiceNumberValidation {
  /** T+13桁の形式に合致するか */
  formatValid: boolean;
  /** 正規化した登録番号(T+13桁)。形式不正は null */
  number: string | null;
  /**
   * 13桁部分が法人番号の検査用数字として整合するか。
   * 形式不正は null。法人番号として正しければ true。
   * 個人事業者等の登録番号は法人番号ではないため false になり得る(=必ずしも無効ではない)。
   */
  corporateCheckDigitValid: boolean | null;
}

/**
 * 登録番号(T+13桁)を検証する。OCR誤読の一次フィルタに利用できる。
 * formatValid が false なら登録番号ではない。
 * formatValid が true かつ corporateCheckDigitValid が false の場合、
 * 法人番号としては不整合だが個人事業者等の登録番号の可能性は残るため、最終判定は公表サイト照会による。
 */
export function validateInvoiceRegistrationNumber(s: string): InvoiceNumberValidation {
  const t = s.trim();
  if (!/^T\d{13}$/.test(t)) {
    return { formatValid: false, number: null, corporateCheckDigitValid: null };
  }
  return {
    formatValid: true,
    number: t,
    corporateCheckDigitValid: isValidCorporateNumber(t.slice(1)),
  };
}
