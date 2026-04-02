# OpenTax調査 — 税務OSSプロジェクト比較

## 背景
自動仕訳ルールOSS化の参考として、OpenTaxを詳しく調査した。競合ではなく「参考にできるサービス」としてのリサーチ。

---

## 1. OpenTax 基本情報

| 項目 | 内容 |
|------|------|
| 公式サイト | https://opentax.evokelab.ai/ |
| GitHubリポジトリ | https://github.com/xavierliwei/opentax |
| 開発者 | Xavier Li Wei（個人開発者） |
| 組織 | Evoke Lab（evokelab.ai — AI関連の小規模組織/個人プロジェクト） |
| 設立 | 不明（2025〜2026年にかけて開発） |
| 所在地 | 非公開 |
| 資金調達 | なし（確認できず） |
| チーム規模 | 個人開発者主導 |
| ビジネスモデル | **永続無料・完全OSS**。"No upsells, no paywalls, file tax for free, forever" |
| ライセンス | MIT |
| GitHubスター数 | **2**（執筆時点） |
| フォーク数 | 3 |
| 使用言語 | TypeScript 100% |
| 最終更新 | 2025〜2026年にかけてアクティブにメンテナンス中 |

### サービス概要
米国連邦・州個人所得税申告を無料で行えるオープンソースWebアプリケーション。ブラウザ上で完結し、Form 1040、Schedule A〜SE、42州の州税に対応。W-2、1099シリーズ、K-1、ブローカーCSV等の入力書類に対応。

### 注意点
**スター数2は極めて少なく、現時点では広く認知されたプロジェクトではない。** ただし技術的な設計思想（TracedValue、Pure Function）は参考になる。

---

## 2. OSSプロジェクトの詳細

### リポジトリ構造

```
src/model/         税務申告モデル・TracedValue型定義
src/rules/2025/    連邦・州別ルールエンジン（engine.ts, stateEngine.ts等）
src/forms/         PDF生成パイプライン
src/intake/        OCR・PDF解析（W-2/1099自動抽出）
src/store/         Zustandによる状態管理
server/            Node.jsバックエンド
openclaw-plugin/   AIエージェント統合（REST+SSE、16ツール公開）
```

### 「全数値がIRSソースにトレースバック可能」の仕組み

核となる設計思想は **`TracedValue` 型**。すべての計算値がこの型で管理され、以下3つの属性を常に保持:

| 属性 | 説明 |
|------|------|
| `source`（出所） | どの入力フィールドや計算ステップから来たか |
| `confidence`（確信度） | OCRや自動抽出時の信頼度スコア |
| `citation`（IRS引用） | 根拠となるIRS刊行物のリファレンス |

UIでは任意の計算行をクリックすると、その値がどのルールを経由して算出されたかを**トレースグラフ**として表示できる。

### テスト体制
- **2,300件以上のテストケース**
- Vitest（ユニットテスト）+ Playwright（E2Eテスト）の2層構成
- フォーム・スケジュール単位ごとに独立したテストスイート
- 内訳の公開ドキュメントは確認できず

### ルールエンジンの設計パターン

**Pure Function 原則**: 各税務計算ルールは `(TaxReturn, ...deps) → Result` という副作用なし関数として実装。決定論的（LLM非使用）に動作。金額は**整数セント（integer cents）**で管理し、浮動小数点誤差を根本排除。

### AIエージェント統合（OpenClaw）

独立したAIエージェント統合機能。REST+SSEプロトコル経由で**16個のエージェントツール**を公開。税務データ入力の自動化・文書処理・計算・説明生成をAIエージェントから呼び出せる設計。

---

## 3. 技術スタック

| 要素 | 技術 |
|------|------|
| 言語 | TypeScript |
| フロントエンド | React 19 + Vite 7 + Tailwind CSS |
| 状態管理 | Zustand |
| PDF出力 | pdf-lib |
| テスト | Vitest（ユニット）+ Playwright（E2E） |
| バックエンド | Node.js |
| AI統合 | OpenClaw plugin（REST+SSE） |
| データ形式 | TypeScript コード内にルールを直接記述（JSON/YAML外出しではない） |
| 金額管理 | 整数セント（浮動小数点排除） |

---

## 4. 類似OSSプロジェクト比較

| プロジェクト | スター | ライセンス | 最終更新 | 言語 | 特徴 |
|------------|--------|-----------|---------|------|------|
| **OpenTax** | 2 | MIT | 2026活発 | TypeScript | TracedValue型。IRS引用トレース。AIエージェント統合 |
| **UsTaxes** | 1,643 | AGPL-3.0 | 2026-04-02 | TypeScript/React | 完全クライアントサイド。e-file対応。42州対応 |
| **IRS Direct File** | 4,531 | CC0 | 2026-04-02 | Scala/React | **米国国税庁公式**。Fact Graph（宣言型推論）。MeF API直接送信 |
| **GnuCash** | 4,168 | GPL-3.0 | 2026-04-02 | C/C++ | 日本語勘定科目テンプレートあり（17ファイル）。XML形式 |
| **ledger** | 5,902 | BSD系 | 2026-04-02 | C++ | プレインテキスト複式簿記CLI。git管理との親和性高 |
| **hledger** | 4,395 | GPL-3.0 | 2026-04-02 | Haskell | ledger互換。CSV→仕訳自動変換ルール機能 |
| **python-accounting** | 193 | MIT | 2026-03-30 | Python | IFRS/GAAP準拠。SQLAlchemy。post()による明示的仕訳確定 |

### UsTaxes の詳細
- 完全クライアントサイド処理（個人情報をサーバーに送信しない）
- `localStorage` にのみデータ保存
- デスクトップ版はTauriでラップ
- テストはJest
- モジュール分離: 税務ロジックをState（州）ごとに分割

### IRS Direct File の詳細
- 米国SHARE IT Act（2024）に基づく政府OSS公開義務で2025年リリース
- **Fact Graph（宣言型XMLナレッジエンジン）**: 未入力フィールドを含む不完全な状態で税務ロジックを推論できる宣言型設計。「何が分かれば何が計算できるか」を依存グラフとして管理
- 税法の複雑なルールを「インタビューの質問フロー」に変換するレイヤー分離
- CC0ライセンスなので商用利用も完全自由

### GnuCash 日本語テンプレート
- `data/accounts/ja/` ディレクトリに**17ファイル**
- `acctchrt_business.gnucash-xea`（法人）、`acctchrt_checkbook.gnucash-xea`（個人家計）等
- XML形式（`<gnc-account-example>` タグ）
- 各科目は `act:id`（GUID）と `act:parent`（親GUID）で階層表現
- **日本の会計慣行に沿ったテンプレート群が整備済み**

---

## 5. 自動仕訳OSSへの示唆

### 5-1. OpenTaxから参考にすべき点

| アプローチ | 具体的な応用 |
|-----------|------------|
| **TracedValue型** | 仕訳の判定根拠を構造化データとして保持。「なぜこの科目か」をUIで表示可能に |
| **Pure Function原則** | 各仕訳ルールを `(明細データ) → 仕訳結果` の純粋関数として実装。テスト容易性が飛躍的に向上 |
| **IRS citation（引用）** | 各ルールに国税庁のURLを紐づけ。ユーザーが根拠を確認可能 |
| **整数管理（浮動小数点排除）** | 金額を整数（円単位）で管理し、計算誤差を排除 |

### 5-2. IRS Direct Fileから参考にすべき点

| アプローチ | 具体的な応用 |
|-----------|------------|
| **Fact Graph（宣言型推論）** | AIエージェントが「何を聞けば仕訳を確定できるか」を動的に判断する仕組みに転用可能 |
| **CC0ライセンス** | 政府（国税庁）が提供する情報はパブリックドメインに近い。日本の税務ルールもCC0で公開する正当性がある |

### 5-3. GnuCashから参考にすべき点

| アプローチ | 具体的な応用 |
|-----------|------------|
| **日本語勘定科目テンプレート** | freee科目との対応表を作る際のクロスリファレンスとして活用（ただしGPLに注意） |
| **XML階層構造** | 勘定科目の親子関係（大分類→中分類→小分類）の設計参考 |

### 5-4. hledgerから参考にすべき点

| アプローチ | 具体的な応用 |
|-----------|------------|
| **CSV→仕訳変換ルール** | freeeエクスポートCSVを仕訳に自動マッピングする設計の参考 |
| **プレインテキスト仕訳** | AIが仕訳ログを自然言語で読み書きするユースケースとの親和性 |

### 5-5. ルール=テストケースとして管理する設計の具体的な実装方法

OpenTaxのアプローチを日本の仕訳ルールに応用する場合:

```typescript
// ルール定義
const rule = {
  name: "通信費_NTT",
  pattern: /NTT|ソフトバンク|docomo|KDDI/i,
  account: "通信費",
  tax_code: 136, // 課対仕入10%
  citation: "https://www.keisan.nta.go.jp/r5yokuaru/aoiroshinkoku/hitsuyokeihi/index.html",
  confidence: "high"
};

// テストケース（ルールと1:1対応）
describe("通信費_NTT", () => {
  test("NTTドコモの引落しは通信費", () => {
    const result = classify({ description: "NTTドコモ 利用料", amount: 5000 });
    expect(result.account).toBe("通信費");
    expect(result.tax_code).toBe(136);
  });
  
  test("ソフトバンクの引落しは通信費", () => {
    const result = classify({ description: "ソフトバンク モバイル", amount: 8000 });
    expect(result.account).toBe("通信費");
  });
});
```

**ポイント**:
1. ルール1つにつきテストケースを最低2件（正常系+エッジケース）
2. テストケースに`citation`（国税庁URL）を含める
3. 新ルール追加時はテスト必須（PR = ルール + テスト + 根拠URLのセット）

### 5-6. OpenTaxの課題点

| 課題 | 詳細 |
|------|------|
| 認知度が極めて低い | スター数2。実用性は検証されているが利用者が少ない |
| 個人開発者依存 | バス係数1。コミュニティが育っていない |
| ルールがコード直書き | JSON/YAMLでの外出しではなく、TypeScriptコード内にルールを直接記述。非エンジニアの税理士にはコントリビュートしにくい |
| 米国専用 | 日本を含む他国への展開は考慮されていない |

### 5-7. OSSプロジェクトへの推奨設計

OpenTaxの課題を踏まえた本プロジェクト向けの改良:

| OpenTaxの課題 | 本プロジェクトでの改良 |
|-------------|----------------|
| ルールがコード直書き | **JSON/YAMLで外出し**。税理士がエディタで直接編集可能に |
| テストケースの公開ドキュメントなし | **各ルールにテストケース+根拠URLをセットで管理** |
| 米国専用 | **日本の税務ルール（消費税インボイス・法人税等）に特化** |
| 個人開発者依存 | **税理士コミュニティからのPRを歓迎する設計** |

---

## 参考情報

### OpenTax
- 公式サイト: https://opentax.evokelab.ai/
- GitHub: https://github.com/xavierliwei/opentax

### UsTaxes
- GitHub: https://github.com/ustaxes/UsTaxes（スター1,643・AGPL）

### IRS Direct File
- GitHub: https://github.com/IRS-Public/direct-file（スター4,531・CC0）
- [IRS releases source code - Accounting Today](https://www.accountingtoday.com/news/irs-releases-source-code-for-direct-file-program-to-public)

### GnuCash
- GitHub: https://github.com/Gnucash/gnucash（スター4,168・GPL）
- 日本語テンプレート: https://github.com/Gnucash/gnucash/tree/stable/data/accounts/ja

### その他
- ledger: https://github.com/ledger/ledger（スター5,902・BSD）
- hledger: https://github.com/simonmichael/hledger（スター4,395・GPL）
- python-accounting: https://github.com/ekmungai/python-accounting（スター193・MIT）

## コンテキスト
- 消費: 50%
