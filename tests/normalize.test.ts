/**
 * normalizeText ユーティリティのテスト
 *
 * 設計上の注意:
 * - 全角/半角の重複は normalizeText で吸収できる
 *   例: "ＮＴＴ" → "ntt" と "NTT" → "ntt" は同一に正規化される
 * - 英字表記とカナ表記は「別物」として残る
 *   例: "uq mobile" と "uqモバイル" は正規化後も文字列として異なる。
 *   マッチングはこの区別を意識した上位レイヤーで扱うこと。
 */
import { describe, it, expect } from "vitest";
import { normalizeText } from "../src/normalize";

describe("normalizeText", () => {
  it("全角英字を半角小文字に変換する", () => {
    expect(normalizeText("ＮＴＴ")).toBe("ntt");
  });

  it("全角英数混在を半角小文字に変換する", () => {
    expect(normalizeText("ＡＷＳ　ご請求")).toBe("aws ご請求");
  });

  it("半角英字を小文字に変換する", () => {
    expect(normalizeText("Suica")).toBe("suica");
  });

  it("前後の空白を除去する", () => {
    expect(normalizeText("  楽天 ")).toBe("楽天");
  });

  it("カタカナはそのまま維持する", () => {
    // 英字表記 "uq mobile" とカナ表記 "uqモバイル" は別物として残る
    expect(normalizeText("uqモバイル")).toBe("uqモバイル");
  });

  it("全角数字を半角に変換する", () => {
    expect(normalizeText("１２３")).toBe("123");
  });

  it("空文字はそのまま返す", () => {
    expect(normalizeText("")).toBe("");
  });

  it("すでに正規化済みの文字列はそのまま返す", () => {
    expect(normalizeText("amazon web services")).toBe("amazon web services");
  });
});
