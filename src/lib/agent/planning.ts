import type {
  AgentPlanStep,
  IdealCustomerProfile,
  SalesGoal,
} from "./types";

function summarize(values: readonly string[], fallback: string): string {
  return values.length > 0 ? values.join("・") : fallback;
}

export function createAgentPlan(
  goal: SalesGoal,
  icp: IdealCustomerProfile,
): readonly AgentPlanStep[] {
  const target = `${summarize(icp.regions, "地域未指定")}の${summarize(icp.industries, "業種未指定")}`;

  return [
    {
      id: "refine-conditions",
      order: 1,
      title: "条件整理",
      description: `「${goal.statement}」を営業Goalとして、${target}向けのICPと除外条件を確認します。`,
      status: "ready",
      completionCriteria: ["Goalが明文化されている", "ICPと除外条件が構造化されている"],
    },
    {
      id: "discover-candidates",
      order: 2,
      title: "候補企業探索",
      description: "検索上限の範囲で候補を抽出し、公式ドメインと企業名で重複を除きます。",
      status: "pending",
      completionCriteria: ["候補上限を超えない", "重複理由が記録されている"],
    },
    {
      id: "research-official-sites",
      order: 3,
      title: "公式サイト確認",
      description: "事業・所在地・規模・サービスを公式ページで確認し、Sourceを保持します。",
      status: "pending",
      completionCriteria: ["各企業に公式URLがある", "確認事実がEvidenceへ紐付く"],
    },
    {
      id: "form-challenge-hypotheses",
      order: 4,
      title: "課題仮説抽出",
      description: "公開事実から提案に関係する可能性を推論し、断定せず「課題仮説」と表示します。",
      status: "pending",
      completionCriteria: ["仮説と確認事実が区別されている", "仮説にEvidenceがある"],
    },
    {
      id: "evaluate-fit",
      order: 5,
      title: "Fit評価",
      description: "業種30・地域20・規模20・課題一致30の固定ルールで適合度を算出します。",
      status: "pending",
      completionCriteria: ["合計が内訳の和である", "各配点理由が表示される"],
    },
    {
      id: "prioritize",
      order: 6,
      title: "優先順位付け",
      description: "Fit ScoreとEvidenceの充足度からHigh・Medium・Lowへ分類します。",
      status: "pending",
      completionCriteria: ["閾値が明示されている", "優先理由が説明されている"],
    },
    {
      id: "draft-approach",
      order: 7,
      title: "営業文面Draft",
      description: "根拠付きの提案切り口・最初の価値・課題仮説・CTAからDraftを作ります。",
      status: "pending",
      completionCriteria: ["Citationが検証できる", "自動送信機能を持たない"],
    },
    {
      id: "human-review",
      order: 8,
      title: "Human Review",
      description: "人が根拠・表現・送付可否を確認します。MVPの外部ActionはCopyのみです。",
      status: "pending",
      completionCriteria: ["人の確認前に外部送信されない", "Copy前にDraftを修正できる"],
    },
  ];
}
