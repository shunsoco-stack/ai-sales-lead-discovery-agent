# AI営業リード発掘エージェント

営業Goalを受け取り、ICP設計、Candidate Discovery、公式サイト調査、根拠付きQualification、Fit Score、Priority、候補別Approach、Human Reviewまでを一つのProspecting Workflowとして再現するポートフォリオ用Webアプリです。

> 現在は **Demo Dataset専用MVP** です。リアルタイムWeb検索、メール送信、SNS DM、フォーム送信、電話、CRM登録は実装していません。候補と根拠は、2026年8月25日に確認した公開情報のスナップショットです。必ずリンク先の最新情報を人が確認してください。

- Production: https://ai-sales-lead-discovery-agent.vercel.app
- GitHub: https://github.com/shunsoco-stack/ai-sales-lead-discovery-agent

## ポートフォリオ分類

- カテゴリ: AIエージェント
- サブカテゴリ: 営業・リード獲得エージェント

## Workflow

```text
Goal
  ↓
ICP設計
  ↓
Agent Plan / Human Approval
  ↓
Candidate Discovery
  ↓
Company Research
  ↓
Qualification + Evidence
  ↓
Fit Score + Priority
  ↓
Approach Strategy + Draft
  ↓
Human Review → Copy
```

単に営業メールを生成するのではなく、「誰を、なぜ、どの公開根拠で優先するか」を失わずにDraftまでつなげます。

## Demo Mode

- 美容室向けSaaS
- 飲食店向け業務システム
- ダーツ店舗向けWebサービス

デモデータは公式サイトをSourceとして保持し、企業情報、Qualification、課題仮説、提案切り口の各要素から根拠へ遡れるようにしています。Web上で確認できない課題を事実として断定せず、必ず「課題仮説」と表示します。

## Fit Score

合計100点を次の固定ルールで算出します。

| 評価軸 | 配点 |
| --- | ---: |
| 業種適合 | 30 |
| 地域適合 | 20 |
| 規模適合 | 20 |
| 課題一致 | 30 |

- High: 80点以上
- Medium: 60〜79点
- Low: 59点以下

各点数には理由とSource IDが必要で、理由のない任意スコアは生成できません。

## Guardrails

デフォルト上限:

- 最大候補数: 6
- 最大Search数: 8
- 最大Tool Call数: 24
- Retry上限: 2

外部ページの文章はInstructionではなく、信頼できないDataとして扱います。Prompt Injectionのシグナルを検知・隔離し、将来Backend Fetchを接続する場合に備えてlocalhost、private/link-local IP、metadata endpoint、非HTTP(S) URL、認証情報付きURLを拒否するSSRFガードを実装しています。

## Human-in-the-loop

アプリが行う外部Actionはありません。営業文面はDraftで止まり、ユーザーがEvidenceと仮説表現を確認したあとに初めてCopyできます。

```text
Draft → Human Review → Copy
```

## Tech Stack

- Next.js 16 App Router
- React 19 / TypeScript
- Vitest / Testing Library
- Lucide React
- Vercel

## Local Development

```bash
npm install
npm run dev
```

検証:

```bash
npm run verify
```

## Test Coverage

最低限の仕様テストとして、ICP、Planning、Candidate Discovery、Fit Rule、Evidence、Deduplication、Priority、Draft、Citation、Tool Limit、Prompt Injection、SSRFを自動テストします。

## Production Screenshots

本番アプリから取得した5画面は [`docs/screenshots`](docs/screenshots/README.md) に収録しています。

## Security / Limitations

- Secretをクライアントへ渡すコードや外部送信機能はありません。
- URLガードは接続前検証です。実Fetch実装時はDNS解決後とRedirectごとにも再検証してください。
- デモの課題仮説は営業準備の出発点であり、企業の内情を断定するものではありません。
- 営業前にSourceの最新性、連絡先、法令、各社ポリシーを人が確認してください。
