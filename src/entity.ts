/**
 * 適用主体(applicableEntity)ヘルパ
 *
 * ルール/科目が個人事業主(individual)・法人(corporation)・両方(both)の
 * どれに適用されるかを判定する。フィールド未存在・不正値は both とみなす
 * (後方互換: 既存データに applicableEntity が無くても全主体に適用)。
 */

/** 適用主体 */
export type ApplicableEntity = "individual" | "corporation" | "both";

/** 絞り込み対象となる具体主体(both を除く) */
export type ConcreteEntity = "individual" | "corporation";

/**
 * item.applicableEntity を正規化して返す。
 * 未存在・列挙外の値は "both" にフォールバックする。
 */
export function getApplicableEntity(item: { applicableEntity?: unknown }): ApplicableEntity {
  const v = item.applicableEntity;
  return v === "individual" || v === "corporation" ? v : "both";
}

/**
 * item が指定した具体主体に適用されるか。
 * applicableEntity が both のものは個人・法人どちらにも適用される。
 */
export function appliesToEntity(
  item: { applicableEntity?: unknown },
  entity: ConcreteEntity,
): boolean {
  const e = getApplicableEntity(item);
  return e === "both" || e === entity;
}
