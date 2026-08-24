import { getDemoScenario } from "./demo-data";
import { discoverCandidates } from "./discovery";
import { generateApproachStrategy, generateSalesDraft } from "./draft";
import { qualifyCandidate } from "./evidence";
import {
  assertBudgetAvailable,
  consumeAgentBudget,
  createGuardrails,
  EMPTY_AGENT_USAGE,
} from "./guardrails";
import { buildSearchQueries, createIcp } from "./icp";
import { createAgentPlan } from "./planning";
import { calculateFitScore, classifyPriority } from "./scoring";
import type {
  ActivityLogEntry,
  AgentGuardrails,
  AgentRunResult,
  CandidateAnalysis,
  CandidateDiscoveryResult,
  DemoScenarioId,
  IdealCustomerProfile,
  LeadBoardItem,
  LeadBoardStatus,
  SalesGoal,
} from "./types";

const PRIORITY_ORDER = { High: 0, Medium: 1, Low: 2 } as const;

export interface DemoRunOptions {
  readonly icp?: IdealCustomerProfile;
  readonly goal?: SalesGoal;
  readonly guardrails?: Partial<AgentGuardrails>;
}

export function createLeadBoard(
  analyses: readonly CandidateAnalysis[],
  discovery?: CandidateDiscoveryResult,
): readonly LeadBoardItem[] {
  const accepted: LeadBoardItem[] = analyses.map((analysis) => ({
    candidateId: analysis.candidate.id,
    companyName: analysis.candidate.companyName,
    priority: analysis.priority,
    score: analysis.score.total,
    status:
      analysis.priority === "High" ? "approach-candidate" : "researched",
    requiresHumanReview: true,
  }));
  const excluded: LeadBoardItem[] = (discovery?.excluded ?? []).map((item) => ({
    candidateId: item.candidate.id,
    companyName: item.candidate.companyName,
    priority: "Low",
    score: 0,
    status: "rejected",
    requiresHumanReview: true,
  }));
  return [...accepted, ...excluded];
}

export function updateLeadBoardStatus(
  board: readonly LeadBoardItem[],
  candidateId: string,
  status: LeadBoardStatus,
): readonly LeadBoardItem[] {
  if (!board.some((item) => item.candidateId === candidateId)) {
    throw new Error(`Lead Boardに候補「${candidateId}」がありません。`);
  }
  return board.map((item) =>
    item.candidateId === candidateId ? { ...item, status } : item,
  );
}

function buildActivityLog(
  planLength: number,
  searchQueries: readonly string[],
  discovery: CandidateDiscoveryResult,
  analyses: readonly CandidateAnalysis[],
): readonly ActivityLogEntry[] {
  const entries: Omit<ActivityLogEntry, "sequence">[] = [
    {
      phase: "planning",
      action: "Agent Planを作成",
      detail: `${planLength}ステップのPlanをDiscoveryより先に確定しました。`,
      outcome: "completed",
    },
    ...searchQueries.map((query) => ({
      phase: "search" as const,
      action: "Demo Datasetを検索",
      detail: `検索条件「${query}」を固定Demo Datasetへ適用しました。リアルタイムWeb検索ではありません。`,
      outcome: "completed" as const,
    })),
    ...discovery.duplicates.map((duplicate) => ({
      phase: "discovery" as const,
      action: "重複候補を統合",
      detail: `${duplicate.removedCandidateId}を${duplicate.keptCandidateId}へ統合（${duplicate.reason}）。`,
      candidateId: duplicate.removedCandidateId,
      outcome: "excluded" as const,
    })),
    ...discovery.excluded.map((excluded) => ({
      phase: "discovery" as const,
      action: "候補を除外",
      detail: excluded.detail,
      candidateId: excluded.candidate.id,
      outcome: "excluded" as const,
    })),
    ...analyses.flatMap((analysis) => [
      {
        phase: "research" as const,
        action: "公式Sourceを確認",
        detail: `${analysis.candidate.companyName}: ${analysis.candidate.evidence.length}件の公開Sourceを構造化しました。`,
        candidateId: analysis.candidate.id,
        outcome: "completed" as const,
      },
      {
        phase: "qualification" as const,
        action: "Fitを評価",
        detail: `${analysis.candidate.companyName}: 30/20/20/30ルールで${analysis.score.total}点。${analysis.qualification.challengeHypotheses.length}件を「課題仮説」として保持しました。`,
        candidateId: analysis.candidate.id,
        outcome: "completed" as const,
      },
      {
        phase: "priority" as const,
        action: `${analysis.priority}に分類`,
        detail: analysis.priorityReason,
        candidateId: analysis.candidate.id,
        outcome: "completed" as const,
      },
      {
        phase: "draft" as const,
        action: "Approach Draftを作成",
        detail: `${analysis.draft.citations.length}件のCitationを付け、Human Review待ちにしました。`,
        candidateId: analysis.candidate.id,
        outcome: "completed" as const,
      },
    ]),
    {
      phase: "review",
      action: "Human Reviewで停止",
      detail: "外部Actionは実行していません。確認後にCopyできます。",
      outcome: "waiting-human-review",
    },
  ];

  return entries.map((entry, index) => ({ ...entry, sequence: index + 1 }));
}

/**
 * Runs the complete portfolio workflow against disclosed, fixed demo data.
 * No network request, email, DM, form submission, phone call, or CRM action exists here.
 */
export function runDemoProspecting(
  scenarioId: DemoScenarioId,
  options: DemoRunOptions = {},
): AgentRunResult {
  const baseScenario = getDemoScenario(scenarioId);
  const icp = createIcp(options.icp ?? baseScenario.icp);
  const goal = options.goal ?? baseScenario.goal;
  const scenario = { ...baseScenario, icp, goal };
  const guardrails = createGuardrails(options.guardrails);

  // Planning is intentionally the first workflow transition.
  const plan = createAgentPlan(goal, icp);
  const searchQueries = buildSearchQueries(icp, guardrails.maxSearches);
  let usage = assertBudgetAvailable(
    consumeAgentBudget(
      EMPTY_AGENT_USAGE,
      guardrails,
      "searches",
      searchQueries.length,
    ),
  );
  const discovery = discoverCandidates(
    scenario.candidates,
    icp,
    guardrails.maxCandidates,
  );
  usage = assertBudgetAvailable(
    consumeAgentBudget(
      usage,
      guardrails,
      "candidates",
      discovery.candidates.length,
    ),
  );
  const requiredToolCalls =
    searchQueries.length +
    discovery.candidates.reduce(
      (sum, candidate) => sum + candidate.evidence.length,
      0,
    ) +
    discovery.candidates.length * 2;
  usage = assertBudgetAvailable(
    consumeAgentBudget(
      usage,
      guardrails,
      "toolCalls",
      requiredToolCalls,
    ),
  );

  const analyses = discovery.candidates
    .map((candidate): CandidateAnalysis => {
      const qualification = qualifyCandidate(candidate, icp);
      const score = calculateFitScore(candidate, icp);
      const priorityResult = classifyPriority(
        score,
        qualification.evidenceCompleteness,
      );
      const approach = generateApproachStrategy(
        candidate,
        goal,
        qualification,
      );
      const draft = generateSalesDraft(candidate, goal, approach);
      return {
        candidate,
        qualification,
        score,
        priority: priorityResult.priority,
        priorityReason: priorityResult.reason,
        approach,
        draft,
      };
    })
    .sort(
      (left, right) =>
        PRIORITY_ORDER[left.priority] - PRIORITY_ORDER[right.priority] ||
        right.score.total - left.score.total ||
        left.candidate.companyName.localeCompare(
          right.candidate.companyName,
          "ja",
        ),
    );

  const leadBoard = createLeadBoard(analyses, discovery);
  const activityLog = buildActivityLog(
    plan.length,
    searchQueries,
    discovery,
    analyses,
  );

  return {
    scenario,
    plan,
    searchQueries,
    discovery,
    analyses,
    leadBoard,
    activityLog,
    guardrails,
    usage,
    mode: "demo-dataset",
    externalActionsPerformed: false,
  };
}
