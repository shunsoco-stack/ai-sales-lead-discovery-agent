import { validatePublicHttpUrl } from "./security";
import { observationMatchesRange } from "./matching";
import type {
  Citation,
  EvidenceBackedReason,
  EvidenceTopic,
  IdealCustomerProfile,
  LeadCandidate,
  Qualification,
  ValidationIssue,
  ValidationResult,
} from "./types";

function evidenceForTopic(
  candidate: LeadCandidate,
  topic: EvidenceTopic,
): readonly string[] {
  return candidate.evidence
    .filter((evidence) => evidence.supports.includes(topic))
    .map((evidence) => evidence.id);
}

function validateEvidenceReferences(
  candidate: LeadCandidate,
  ids: readonly string[],
  path: string,
  requiredTopic?: EvidenceTopic,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (ids.length === 0) {
    issues.push({
      code: "citation-required",
      path,
      message: "公開Sourceへの参照がありません。",
    });
  }

  for (const id of ids) {
    const evidence = candidate.evidence.find((item) => item.id === id);
    if (evidence === undefined) {
      issues.push({
        code: "citation-not-found",
        path,
        message: `Evidence「${id}」が候補企業のSourceに存在しません。`,
      });
    } else if (
      requiredTopic !== undefined &&
      !evidence.supports.includes(requiredTopic)
    ) {
      issues.push({
        code: "citation-topic-mismatch",
        path,
        message: `Evidence「${id}」は${requiredTopic}の根拠として登録されていません。`,
      });
    }
  }
  return issues;
}

export function validateCandidateEvidence(
  candidate: LeadCandidate,
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const candidateUrlSafety = validatePublicHttpUrl(candidate.url);
  if (!candidateUrlSafety.safe) {
    issues.push({
      code: "unsafe-company-url",
      path: "url",
      message: candidateUrlSafety.detail,
    });
  }

  const seenIds = new Set<string>();
  candidate.evidence.forEach((evidence, index) => {
    const path = `evidence.${index}`;
    if (!evidence.id.trim() || seenIds.has(evidence.id)) {
      issues.push({
        code: "duplicate-or-empty-evidence-id",
        path: `${path}.id`,
        message: `Evidence ID「${evidence.id}」が空か重複しています。`,
      });
    }
    seenIds.add(evidence.id);

    if (!evidence.title.trim() || !evidence.summary.trim()) {
      issues.push({
        code: "evidence-content-required",
        path,
        message: "Sourceのタイトルと要約は必須です。",
      });
    }
    if (evidence.supports.length === 0) {
      issues.push({
        code: "evidence-topic-required",
        path: `${path}.supports`,
        message: "Sourceが裏付ける事実種別を指定してください。",
      });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(evidence.checkedAt)) {
      issues.push({
        code: "checked-date-invalid",
        path: `${path}.checkedAt`,
        message: "確認日はYYYY-MM-DD形式で指定してください。",
      });
    }

    const urlSafety = validatePublicHttpUrl(evidence.url);
    if (!urlSafety.safe) {
      issues.push({
        code: "unsafe-evidence-url",
        path: `${path}.url`,
        message: urlSafety.detail,
      });
    }
  });

  candidate.challengeHypotheses.forEach((hypothesis, index) => {
    if (hypothesis.label !== "課題仮説") {
      issues.push({
        code: "hypothesis-label-required",
        path: `challengeHypotheses.${index}.label`,
        message: "推論は必ず「課題仮説」と表示してください。",
      });
    }
    issues.push(
      ...validateEvidenceReferences(
        candidate,
        hypothesis.evidenceIds,
        `challengeHypotheses.${index}.evidenceIds`,
        "challenge-hypothesis",
      ),
    );
  });

  if (candidate.employeeCount !== undefined) {
    issues.push(
      ...validateEvidenceReferences(
        candidate,
        candidate.employeeCount.evidenceIds,
        "employeeCount.evidenceIds",
        "scale",
      ),
    );
  }
  if (candidate.storeCount !== undefined) {
    issues.push(
      ...validateEvidenceReferences(
        candidate,
        candidate.storeCount.evidenceIds,
        "storeCount.evidenceIds",
        "scale",
      ),
    );
  }

  return { valid: issues.length === 0, issues };
}

export function createCitations(
  candidate: LeadCandidate,
  requestedEvidenceIds: readonly string[] = candidate.evidence.map(
    (evidence) => evidence.id,
  ),
): readonly Citation[] {
  const requested = new Set(requestedEvidenceIds);
  return candidate.evidence
    .filter((evidence) => requested.has(evidence.id))
    .map((evidence, index) => ({
      number: index + 1,
      evidenceId: evidence.id,
      title: evidence.title,
      url: evidence.url,
      sourceType: evidence.sourceType,
    }));
}

export function validateCitations(
  citations: readonly Citation[],
  candidate: LeadCandidate,
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const seenNumbers = new Set<number>();
  const seenEvidenceIds = new Set<string>();

  citations.forEach((citation, index) => {
    const evidence = candidate.evidence.find(
      (item) => item.id === citation.evidenceId,
    );
    if (evidence === undefined) {
      issues.push({
        code: "citation-not-found",
        path: `citations.${index}`,
        message: `Citation「${citation.evidenceId}」に対応するSourceがありません。`,
      });
      return;
    }

    if (
      evidence.url !== citation.url ||
      evidence.title !== citation.title ||
      evidence.sourceType !== citation.sourceType
    ) {
      issues.push({
        code: "citation-source-mismatch",
        path: `citations.${index}`,
        message: `Citation「${citation.evidenceId}」が元Sourceと一致しません。`,
      });
    }
    if (citation.number !== index + 1 || seenNumbers.has(citation.number)) {
      issues.push({
        code: "citation-order-invalid",
        path: `citations.${index}.number`,
        message: "Citation番号は1から連番にしてください。",
      });
    }
    if (seenEvidenceIds.has(citation.evidenceId)) {
      issues.push({
        code: "citation-duplicate",
        path: `citations.${index}.evidenceId`,
        message: "同じSourceが重複して引用されています。",
      });
    }
    seenNumbers.add(citation.number);
    seenEvidenceIds.add(citation.evidenceId);
  });

  return { valid: issues.length === 0, issues };
}

export function isHypothesisEvidenceBacked(
  candidate: LeadCandidate,
  hypothesisId: string,
): boolean {
  const hypothesis = candidate.challengeHypotheses.find(
    (item) => item.id === hypothesisId,
  );
  if (hypothesis === undefined || hypothesis.evidenceIds.length === 0) return false;
  return hypothesis.evidenceIds.every((id) => {
    const evidence = candidate.evidence.find((item) => item.id === id);
    return evidence?.supports.includes("challenge-hypothesis") === true;
  });
}

export function qualifyCandidate(
  candidate: LeadCandidate,
  icp?: IdealCustomerProfile,
): Qualification {
  const validation = validateCandidateEvidence(candidate);
  const reasons: EvidenceBackedReason[] = [];

  const industryEvidence = evidenceForTopic(candidate, "industry");
  if (industryEvidence.length > 0) {
    reasons.push({
      topic: "industry",
      statement: `業種: ${candidate.industry}`,
      evidenceIds: industryEvidence,
    });
  }
  const locationEvidence = evidenceForTopic(candidate, "location");
  if (locationEvidence.length > 0) {
    reasons.push({
      topic: "location",
      statement: `所在地・展開地域: ${candidate.location}`,
      evidenceIds: locationEvidence,
    });
  }
  const businessEvidence = evidenceForTopic(candidate, "business");
  if (businessEvidence.length > 0) {
    reasons.push({
      topic: "business",
      statement: candidate.businessSummary,
      evidenceIds: businessEvidence,
    });
  }
  if (candidate.employeeCount !== undefined) {
    reasons.push({
      topic: "scale",
      statement: `${candidate.employeeCount.label}: ${candidate.employeeCount.value.toLocaleString("ja-JP")}`,
      evidenceIds: candidate.employeeCount.evidenceIds,
    });
  }
  if (candidate.storeCount !== undefined) {
    reasons.push({
      topic: "scale",
      statement: `${candidate.storeCount.label}: ${candidate.storeCount.value.toLocaleString("ja-JP")}`,
      evidenceIds: candidate.storeCount.evidenceIds,
    });
  }

  const validHypotheses = candidate.challengeHypotheses.filter((hypothesis) =>
    isHypothesisEvidenceBacked(candidate, hypothesis.id),
  );
  const scaleObservationIsBacked = (
    observation: LeadCandidate["employeeCount"] | LeadCandidate["storeCount"],
  ): boolean =>
    observation !== undefined &&
    observation.evidenceIds.length > 0 &&
    observation.evidenceIds.every((id) =>
      candidate.evidence
        .find((evidence) => evidence.id === id)
        ?.supports.includes("scale"),
    );
  const requiredScaleChecks = [
    ...(icp?.employeeCount === null || icp?.employeeCount === undefined
      ? []
      : [
          observationMatchesRange(candidate.employeeCount, icp.employeeCount) &&
            scaleObservationIsBacked(candidate.employeeCount),
        ]),
    ...(icp?.storeCount === null || icp?.storeCount === undefined
      ? []
      : [
          observationMatchesRange(candidate.storeCount, icp.storeCount) &&
            scaleObservationIsBacked(candidate.storeCount),
        ]),
  ];
  const requiredScaleComplete = requiredScaleChecks.every(Boolean);
  const keyTopicsPresent =
    industryEvidence.length > 0 &&
    locationEvidence.length > 0 &&
    businessEvidence.length > 0 &&
    requiredScaleComplete;
  const evidenceCompleteness: Qualification["evidenceCompleteness"] =
    candidate.evidence.length === 0
      ? "missing"
      : validation.valid && keyTopicsPresent
        ? "complete"
        : "partial";

  return {
    candidateId: candidate.id,
    fitReasons: reasons,
    challengeHypotheses: validHypotheses,
    evidenceCompleteness,
    caveats: [
      "課題は公開情報からの仮説であり、企業が実際に困っていると断定するものではありません。",
      ...(validation.valid
        ? []
        : [`Evidence検証で${validation.issues.length}件の要確認項目があります。`]),
      ...(requiredScaleComplete
        ? []
        : ["ICPで指定した規模条件を確認できる公開Sourceが不足しています。"]),
    ],
  };
}
