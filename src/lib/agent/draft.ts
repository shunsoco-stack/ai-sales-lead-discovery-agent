import { createCitations } from "./evidence";
import type {
  ApproachStrategy,
  LeadCandidate,
  Qualification,
  SalesDraft,
  SalesGoal,
} from "./types";

export function generateApproachStrategy(
  candidate: LeadCandidate,
  goal: SalesGoal,
  qualification: Qualification,
): ApproachStrategy {
  const primaryHypothesis = qualification.challengeHypotheses[0];
  const assumedChallenge = primaryHypothesis
    ? `課題仮説: ${primaryHypothesis.statement}`
    : "課題仮説: 公開情報だけでは具体的な課題を確認できないため、初回接点で現状を伺う必要があります。";
  const evidenceIds = primaryHypothesis?.evidenceIds ?? [];

  return {
    candidateId: candidate.id,
    angle: primaryHypothesis
      ? `${primaryHypothesis.tags[0] ?? "業務改善"}を起点に、${goal.offerName}との適合可能性を確認する。`
      : `${candidate.businessSummary}を起点に、現状確認から始める。`,
    firstValue: goal.valueProposition,
    assumedChallenge,
    cta: "まず15分、現在の運用と優先課題を伺う情報交換を提案する。",
    evidenceIds,
  };
}

export function generateSalesDraft(
  candidate: LeadCandidate,
  goal: SalesGoal,
  strategy: ApproachStrategy,
): SalesDraft {
  const citations = createCitations(candidate, strategy.evidenceIds);
  const primaryEvidence = citations[0]
    ? candidate.evidence.find(
        (evidence) => evidence.id === citations[0].evidenceId,
      )
    : undefined;
  const sourceLine = primaryEvidence
    ? `公式サイトの公開情報から、${primaryEvidence.summary}[1]`
    : "公開情報だけでは現在の運用を確認しきれなかったため、まず状況を伺いたくご連絡しました。";
  const hypothesisCitationMarkers = citations
    .map((citation) => `[${citation.number}]`)
    .join("");

  const body = [
    `${candidate.companyName} ご担当者様`,
    "",
    "突然のご連絡失礼いたします。",
    sourceLine,
    "",
    `${strategy.assumedChallenge}${hypothesisCitationMarkers} この仮説に対し、${goal.offerName}で「${strategy.firstValue}」をご支援できる可能性があると考えました。`,
    "",
    `${strategy.cta} ご関心がありましたら、ご都合のよい時間帯をお知らせいただけますでしょうか。`,
    "",
    "※本内容は公開情報に基づくDraftです。課題を断定せず、送付前に必ず人が内容と根拠を確認してください。",
  ].join("\n");

  return {
    candidateId: candidate.id,
    subject: `【情報交換のお願い】${goal.offerName}による${goal.desiredOutcome}`,
    body,
    status: "draft",
    nextStep: "human-review",
    humanReviewRequired: true,
    canAutoSend: false,
    copyOnly: true,
    claimEvidenceIds: strategy.evidenceIds,
    citations,
    safetyNote: "自動送信・SNS DM・フォーム送信・電話・CRM登録は行いません。Human Review後のCopyのみです。",
  };
}
