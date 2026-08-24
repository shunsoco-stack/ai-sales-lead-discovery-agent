# 既存ポートフォリオ掲載用・完全版プロンプト

以下のプロンプトを、既存ポートフォリオを編集できるコーディングエージェントへそのまま渡してください。

---

あなたは、既存ポートフォリオサイトへ完成済みプロジェクトを追加するコーディングエージェントです。既存サイトの情報設計、コンポーネント構成、デザイントークン、文体、ルーティング、レスポンシブ仕様を先に調査し、それらを崩さずに次の案件を掲載してください。既存案件や無関係なファイルは変更せず、必要最小限の差分にしてください。

## 1. 掲載するプロジェクトの固定情報

- アプリ名：`AI営業リード発掘エージェント`
- カテゴリ：`AIエージェント`
- サブカテゴリ：`営業・リード獲得エージェント`
- 本番アプリ：`https://ai-sales-lead-discovery-agent.vercel.app`
- GitHub：`https://github.com/shunsoco-stack/ai-sales-lead-discovery-agent`
- 実装：Next.js / React / TypeScript / Vitest
- 公開先：Vercel Production

アプリ名を別のブランド名、英語名、略称へ変更しないでください。カテゴリとサブカテゴリも上記の文字列をそのまま使用してください。

## 2. この作品の位置づけ

本作は、単に営業メールを生成するAIではありません。ユーザーの営業目的からIdeal Customer Profile（ICP）を整理し、候補探索、公式情報の調査、根拠付きQualification、明示ルールによるFit Score、優先順位、企業別のアプローチ戦略、営業DM Draft、Human Reviewまでを一続きにした営業Prospecting Workflowです。

掲載時は、次のワークフローが作品の中心であることを明確に伝えてください。

`Goal → ICP設計 → Agent Plan → Candidate Discovery → Company Research → Qualification → Evidence → Scoring → Priority → Approach Strategy → Human Review → Copy`

「会社を検索して営業文を書くだけ」「営業メールを書いてくれるAI」といった紹介に縮小しないでください。

## 3. 必ず表示するDemo Datasetの説明

現在のポートフォリオ版は、実Web Searchではなく、公開情報をもとに事前構成した固定の`Demo Dataset`でAgent Workflowを再現しています。カード、詳細ページ、スクリーンショット説明のいずれか一か所だけではなく、閲覧者が誤認しない位置に次の趣旨を明記してください。

> Demo Dataset版：候補探索と企業調査は固定データで再現しています。リアルタイムWeb検索や外部サービスへの自動送信には対応していません。

「リアルタイム検索対応」「AIがWeb全体を自動巡回」「自動送信対応」など、未実装機能を示す表現は禁止です。デモが用意されている営業テーマは次の3種類です。

- 美容室向けSaaS
- 飲食店向け業務システム
- ダーツ店舗向けWebサービス

## 4. ポートフォリオカード用コピー

既存サイトの文字数制限に合わせて調整して構いませんが、意味は維持してください。

- タイトル：`AI営業リード発掘エージェント`
- カテゴリ表示：`AIエージェント / 営業・リード獲得エージェント`
- 短い説明：`営業GoalからICPを設計し、公開情報に基づく候補評価、根拠付きスコアリング、企業別アプローチ案、Human Reviewまでを再現する営業Prospecting Agent。`
- 補助ラベル：`Demo Dataset`、`Human-in-the-loop`、`Evidence-based Scoring`
- CTA：`デモを見る`（`https://ai-sales-lead-discovery-agent.vercel.app`）と`ソースを見る`（`https://github.com/shunsoco-stack/ai-sales-lead-discovery-agent`）

## 5. 詳細ページで説明する機能

次の内容を、既存ポートフォリオの詳細ページ構成に沿って簡潔かつ具体的に掲載してください。

### Goal・ICP・Agent Planning

- 自由入力した営業Goalから、最初に実行Planを作成する。
- ICPでは業種、地域、従業員規模、店舗数、Webサイト有無、特定サービス利用有無、課題、除外条件を整理できる。
- 条件整理、候補企業探索、公式サイト確認、課題仮説抽出、Fit評価、優先順位付け、営業文面Draftという計画を可視化する。

### Candidate Discovery・Company Research

- 候補ごとに企業名、業種、URL、所在地、事業内容、根拠Sourceを構造化する。
- 重複候補を排除し、Lead Boardで`未確認 → 調査済み → アプローチ候補 → 見送り`の状態を管理する。
- Activity Logで、調査内容、除外理由、優先理由を時系列に確認できる。

### Qualification・Evidence

- 店舗数、現行運用、サービス構成、公開情報から読み取れる状況、提案との関連性を候補ごとに分析する。
- 営業理由は必ず公開Sourceと紐付け、引用・参照先を表示する。
- 公開情報から直接確認できないニーズは断定せず、必ず`課題仮説`と表記する。

### Fit Score・Priority

Fit Scoreは理由のないAI採点ではなく、次の100点満点ルールで算出していることを表示してください。

- 業種適合：30点
- 地域適合：20点
- 規模適合：20点
- 課題一致：30点

各内訳と根拠を見せ、Evidenceが不足する候補はPriorityを下げます。候補は`High`、`Medium`、`Low`に分類し、優先・見送りの理由も表示します。

### Approach Strategy・Human Review

- 候補企業ごとに、提案切り口、最初に伝える価値、想定課題、CTAを作成する。
- 営業メール・DMはDraftのみ生成する。
- 操作フローは必ず`Draft → Human Review → Copy`とし、自動送信は行わない。
- メール送信、SNS DM、フォーム送信、電話、CRM登録をAgentが勝手に実行しないHuman-in-the-loop設計である。

### Guardrail・Security

- 既定上限：最大候補数6、最大Search数8、最大Tool Call数24、Retry上限2。
- 企業Webページの文章はInstructionではなく、信頼できないDataとして扱うPrompt Injection対策を備える。
- Backend Fetchを実装する場合に備え、localhost、private IP、link-local、metadata endpoint、危険なredirectを拒否するSSRF対策を実装している。

## 6. 5枚の本番スクリーンショット

以下は、Vercel Productionの同一デプロイから取得した実本番アプリのスクリーンショットです。モック画像や開発環境の画像に置き換えないでください。元画像を消去・上書きせず、ポートフォリオの画像管理方式に合わせてコピーまたは参照してください。

1. Goal / ICP設定
   - 元画像：`ai-sales-lead-discovery-agent/docs/screenshots/01-icp-goal.png`
   - alt：`AI営業リード発掘エージェントの営業GoalとICP設定画面`
2. Agent Plan
   - 元画像：`ai-sales-lead-discovery-agent/docs/screenshots/02-agent-plan.png`
   - alt：`AI営業リード発掘エージェントが作成した実行Plan画面`
3. Lead候補一覧
   - 元画像：`ai-sales-lead-discovery-agent/docs/screenshots/03-lead-candidates.png`
   - alt：`Fit ScoreとPriorityを表示したLead候補一覧`
4. Company Research + Evidence
   - 元画像：`ai-sales-lead-discovery-agent/docs/screenshots/04-company-research-evidence.png`
   - alt：`企業調査と公開Sourceに紐付いたEvidenceおよび課題仮説`
5. Approach Draft
   - 元画像：`ai-sales-lead-discovery-agent/docs/screenshots/05-approach-draft.png`
   - alt：`Human Review前の企業別アプローチ戦略と営業DM Draft`

詳細ページでは5枚すべてを、上記の順序で機能説明と対応付けて配置してください。画像ギャラリーだけにまとめて説明から切り離さず、各画像の近くに「何を設計・実装した画面か」が分かる短いキャプションを付けてください。スマートフォンでは画像を横にはみ出させず、必要ならタップまたはクリックで拡大できる既存UIを使用してください。

## 7. 推奨する詳細ページ構成

既存サイトに同等の構成がある場合はそれを優先し、なければ次の順序で組み立ててください。

1. タイトル、カテゴリ、Demo Dataset表示、Production/GitHub CTA
2. 営業課題と作品コンセプト
3. Prospecting Workflow全体
4. Goal / ICPとAgent Plan
5. Candidate Discovery、Lead Board、Activity Log
6. Company Research、Qualification、Evidence、課題仮説
7. 明示ルールによるFit ScoreとPriority
8. Approach Strategy、Draft、Human Review、Copy
9. Guardrail、Prompt Injection対策、SSRF対策
10. 3種類のDemo Modeと技術情報

## 8. 実装上の注意

- 既存ポートフォリオのカードデータ、カテゴリフィルター、詳細ページ、サイトマップ、メタデータ、OG情報など、作品追加に必要な登録箇所を調査して漏れなく更新してください。
- `AIエージェント`カテゴリと`営業・リード獲得エージェント`サブカテゴリが既存データモデルにない場合は、既存の型とUIを壊さない最小差分で追加してください。
- ProductionとGitHubの外部リンクは正しいURLへ接続し、既存規約に従って安全な外部リンク属性を設定してください。
- 5枚すべてに内容を説明する日本語altを設定し、画像の表示崩れやレイアウトシフトを避けてください。
- 実装済みの範囲だけを記載してください。Demo Dataset、Human Review、自動送信禁止、根拠付き評価の説明は削除しないでください。
- 既存サイトのデザインへ自然に統合し、この作品だけ別ブランドや別デザインシステムにしないでください。

## 9. 完了条件

作業後に、次の項目をすべて確認してください。

- アプリ名が全箇所で`AI営業リード発掘エージェント`になっている。
- カテゴリが`AIエージェント`、サブカテゴリが`営業・リード獲得エージェント`になっている。
- Production URLとGitHub URLが上記の実URLであり、両方のリンクが開く。
- Demo Dataset版であることが、カードまたは詳細導線だけに依存せず明確に伝わる。
- ICPからHuman Reviewまでの全ワークフロー、明示スコア、Evidence、課題仮説、Priorityを説明している。
- 自動送信を行わないことと`Draft → Human Review → Copy`を説明している。
- Guardrail、Prompt Injection対策、SSRF対策を説明している。
- 指定した実本番スクリーンショット5枚をすべて正しい順序で配置し、altとキャプションを付けている。
- PCとスマートフォンの両方でカード、詳細ページ、画像、CTAが崩れない。
- lint、型チェック、テスト、Production buildなど既存リポジトリで定められた検証が成功する。
- 差分を確認し、無関係なファイル、Secret、ローカル設定ファイルを含めていない。

最後に、変更ファイル、追加した掲載箇所、検証結果、Production URL、GitHub URL、スクリーンショット5枚の参照先を報告してください。
