import {
  anyValueMatches,
  observationMatchesRange,
  valuesMatch,
} from "./matching";
import type {
  FitScore,
  IdealCustomerProfile,
  LeadCandidate,
  Priority,
  Qualification,
  ScoreBreakdownItem,
  ScoreRuleItem,
} from "./types";

export const FIT_SCORE_RULE = [
  { dimension: "industry", label: "業種適合", maxPoints: 30 },
  { dimension: "region", label: "地域", maxPoints: 20 },
  { dimension: "scale", label: "規模", maxPoints: 20 },
  { dimension: "challenge", label: "課題一致", maxPoints: 30 },
] as const satisfies readonly ScoreRuleItem[];

export const PRIORITY_THRESHOLDS = Object.freeze({
  High: 80,
  Medium: 60,
});

function evidenceIdsForTopic(
  candidate: LeadCandidate,
  topic: Parameters<LeadCandidate["evidence"][number]["supports"]["includes"]>[0],
): string[] {
  return candidate.evidence
    .filter((evidence) => evidence.supports.includes(topic))
    .map((evidence) => evidence.id);
}

function hasEvidenceIds(
  candidate: LeadCandidate,
  ids: readonly string[],
  requiredTopic?: "scale" | "challenge-hypothesis",
): boolean {
  if (ids.length === 0) return false;
  return ids.every((id) => {
    const evidence = candidate.evidence.find((item) => item.id === id);
    return (
      evidence !== undefined &&
      (requiredTopic === undefined || evidence.supports.includes(requiredTopic))
    );
  });
}

function scoreIndustry(
  candidate: LeadCandidate,
  icp: IdealCustomerProfile,
): ScoreBreakdownItem {
  const evidenceIds = evidenceIdsForTopic(candidate, "industry");
  const matches = anyValueMatches([candidate.industry], icp.industries);
  const evidenceBacked = evidenceIds.length > 0;
  return {
    ...FIT_SCORE_RULE[0],
    awardedPoints: matches && evidenceBacked ? 30 : 0,
    reason: !matches
      ? `候補の業種「${candidate.industry}」はICP（${icp.industries.join("・")}）と一致しません。`
      : evidenceBacked
        ? `候補の業種「${candidate.industry}」がICPと一致し、公式Sourceで確認できます。`
        : "業種は一致しますが、裏付ける公式Sourceがありません。",
    evidenceIds,
  };
}

function scoreRegion(
  candidate: LeadCandidate,
  icp: IdealCustomerProfile,
): ScoreBreakdownItem {
  const evidenceIds = evidenceIdsForTopic(candidate, "location");
  const matches = anyValueMatches([candidate.location], icp.regions);
  const evidenceBacked = evidenceIds.length > 0;
  return {
    ...FIT_SCORE_RULE[1],
    awardedPoints: matches && evidenceBacked ? 20 : 0,
    reason: !matches
      ? `候補の地域「${candidate.location}」はICP（${icp.regions.join("・")}）の範囲外です。`
      : evidenceBacked
        ? `候補の地域「${candidate.location}」がICPと一致し、公式Sourceで確認できます。`
        : "地域は一致しますが、裏付ける公式Sourceがありません。",
    evidenceIds,
  };
}

function scoreScale(
  candidate: LeadCandidate,
  icp: IdealCustomerProfile,
): ScoreBreakdownItem {
  const criteria = [
    ...(icp.employeeCount === null
      ? []
      : [
          {
            label: "従業員規模",
            matches:
              observationMatchesRange(candidate.employeeCount, icp.employeeCount) &&
              hasEvidenceIds(candidate, candidate.employeeCount?.evidenceIds ?? [], "scale"),
            evidenceIds: candidate.employeeCount?.evidenceIds ?? [],
          },
        ]),
    ...(icp.storeCount === null
      ? []
      : [
          {
            label: "店舗規模",
            matches:
              observationMatchesRange(candidate.storeCount, icp.storeCount) &&
              hasEvidenceIds(candidate, candidate.storeCount?.evidenceIds ?? [], "scale"),
            evidenceIds: candidate.storeCount?.evidenceIds ?? [],
          },
        ]),
  ];

  if (criteria.length === 0) {
    return {
      ...FIT_SCORE_RULE[2],
      awardedPoints: 20,
      reason: "ICPで従業員数・店舗数の条件が指定されていないため満点です。",
      evidenceIds: [],
    };
  }

  const matched = criteria.filter((criterion) => criterion.matches);
  return {
    ...FIT_SCORE_RULE[2],
    awardedPoints: Math.round((20 * matched.length) / criteria.length),
    reason: `${criteria.map((criterion) => `${criterion.label}:${criterion.matches ? "適合" : "未確認/不適合"}`).join("、")}（${matched.length}/${criteria.length}条件）。`,
    evidenceIds: [...new Set(matched.flatMap((criterion) => criterion.evidenceIds))],
  };
}

function scoreChallenges(
  candidate: LeadCandidate,
  icp: IdealCustomerProfile,
): ScoreBreakdownItem {
  if (icp.challenges.length === 0) {
    return {
      ...FIT_SCORE_RULE[3],
      awardedPoints: 30,
      reason: "ICPで課題条件が指定されていないため満点です。",
      evidenceIds: [],
    };
  }

  const matchedHypotheses = candidate.challengeHypotheses.filter(
    (hypothesis) =>
      hasEvidenceIds(candidate, hypothesis.evidenceIds, "challenge-hypothesis") &&
      icp.challenges.some((challenge) =>
        hypothesis.tags.some((tag) => valuesMatch(tag, challenge)),
      ),
  );
  const matchedChallenges = icp.challenges.filter((challenge) =>
    matchedHypotheses.some((hypothesis) =>
      hypothesis.tags.some((tag) => valuesMatch(tag, challenge)),
    ),
  );

  return {
    ...FIT_SCORE_RULE[3],
    awardedPoints: Math.round(
      (30 * matchedChallenges.length) / icp.challenges.length,
    ),
    reason: `課題仮説の一致 ${matchedChallenges.length}/${icp.challenges.length}件。課題は断定せず、公式Sourceに基づく仮説として評価します。`,
    evidenceIds: [
      ...new Set(matchedHypotheses.flatMap((hypothesis) => hypothesis.evidenceIds)),
    ],
  };
}

export function calculateFitScore(
  candidate: LeadCandidate,
  icp: IdealCustomerProfile,
): FitScore {
  const breakdown = [
    scoreIndustry(candidate, icp),
    scoreRegion(candidate, icp),
    scoreScale(candidate, icp),
    scoreChallenges(candidate, icp),
  ];
  return {
    total: breakdown.reduce((sum, item) => sum + item.awardedPoints, 0),
    maximum: 100,
    ruleVersion: "30-20-20-30-v1",
    breakdown,
  };
}

export function classifyPriority(
  score: FitScore,
  evidenceCompleteness: Qualification["evidenceCompleteness"] = "complete",
): { readonly priority: Priority; readonly reason: string } {
  let priority: Priority =
    score.total >= PRIORITY_THRESHOLDS.High
      ? "High"
      : score.total >= PRIORITY_THRESHOLDS.Medium
        ? "Medium"
        : "Low";

  if (evidenceCompleteness === "missing") priority = "Low";
  if (evidenceCompleteness === "partial" && priority === "High") {
    priority = "Medium";
  }
  const scaleCondition = score.breakdown.find(
    (item) => item.dimension === "scale",
  );
  const hasIncompleteScaleCondition =
    scaleCondition !== undefined &&
    scaleCondition.awardedPoints < scaleCondition.maxPoints;
  if (hasIncompleteScaleCondition && priority === "High") {
    priority = "Medium";
  }

  const thresholdReason = `Score ${score.total}/100（High: ${PRIORITY_THRESHOLDS.High}以上、Medium: ${PRIORITY_THRESHOLDS.Medium}以上）`;
  const evidenceReason =
    evidenceCompleteness === "complete"
      ? "Evidenceは充足しています。"
      : evidenceCompleteness === "partial"
        ? "Evidenceが一部不足するためHighにはしません。"
        : "EvidenceがないためLowに制限します。";
  const scaleReason = hasIncompleteScaleCondition
    ? " ICPで指定した規模条件が未確認または不適合のためHighにはしません。"
    : "";
  return { priority, reason: `${thresholdReason}。${evidenceReason}${scaleReason}` };
}
