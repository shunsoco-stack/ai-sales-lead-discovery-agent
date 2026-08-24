import { candidateIsInIcpScope, normalizeComparable, valuesMatch } from "./matching";
import type {
  CandidateDiscoveryResult,
  DuplicateRecord,
  ExcludedCandidate,
  IdealCustomerProfile,
  LeadCandidate,
} from "./types";

function canonicalDomain(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
  } catch {
    return null;
  }
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function mergeCandidates(
  primary: LeadCandidate,
  duplicate: LeadCandidate,
): LeadCandidate {
  const evidenceKeys = new Set(
    primary.evidence.map((evidence) => `${evidence.id}|${evidence.url}`),
  );
  const hypothesisIds = new Set(
    primary.challengeHypotheses.map((hypothesis) => hypothesis.id),
  );

  return {
    ...primary,
    observedServices: uniqueStrings([
      ...primary.observedServices,
      ...duplicate.observedServices,
    ]),
    exclusionTags: uniqueStrings([
      ...primary.exclusionTags,
      ...duplicate.exclusionTags,
    ]),
    evidence: [
      ...primary.evidence,
      ...duplicate.evidence.filter(
        (evidence) => !evidenceKeys.has(`${evidence.id}|${evidence.url}`),
      ),
    ],
    challengeHypotheses: [
      ...primary.challengeHypotheses,
      ...duplicate.challengeHypotheses.filter(
        (hypothesis) => !hypothesisIds.has(hypothesis.id),
      ),
    ],
  };
}

export function deduplicateCandidates(candidates: readonly LeadCandidate[]): {
  readonly unique: readonly LeadCandidate[];
  readonly duplicates: readonly DuplicateRecord[];
} {
  const unique: LeadCandidate[] = [];
  const duplicates: DuplicateRecord[] = [];

  for (const candidate of candidates) {
    const candidateDomain = canonicalDomain(candidate.url);
    const candidateName = normalizeComparable(candidate.companyName);
    const candidateLocation = normalizeComparable(candidate.location);

    const duplicateIndex = unique.findIndex((existing) => {
      const sameDomain =
        candidateDomain !== null && candidateDomain === canonicalDomain(existing.url);
      const sameNameAndLocation =
        candidateName === normalizeComparable(existing.companyName) &&
        candidateLocation === normalizeComparable(existing.location);
      return sameDomain || sameNameAndLocation;
    });

    if (duplicateIndex < 0) {
      unique.push(candidate);
      continue;
    }

    const kept = unique[duplicateIndex];
    const sameDomain =
      candidateDomain !== null && candidateDomain === canonicalDomain(kept.url);
    duplicates.push({
      keptCandidateId: kept.id,
      removedCandidateId: candidate.id,
      reason: sameDomain ? "same-official-domain" : "same-company-and-location",
    });
    unique[duplicateIndex] = mergeCandidates(kept, candidate);
  }

  return { unique, duplicates };
}

function serviceMatches(
  actualServices: readonly string[],
  condition: string,
): boolean {
  return actualServices.some((service) => valuesMatch(service, condition));
}

function exclusionFor(
  candidate: LeadCandidate,
  icp: IdealCustomerProfile,
): ExcludedCandidate | null {
  if (icp.websiteRequirement === "required" && !candidate.hasWebsite) {
    return {
      candidate,
      reason: "website-required",
      detail: "公式Webサイトを確認できないため除外しました。",
    };
  }

  if (icp.websiteRequirement === "absent" && candidate.hasWebsite) {
    return {
      candidate,
      reason: "website-must-be-absent",
      detail: "WebサイトなしというICP条件に合わないため除外しました。",
    };
  }

  const missingService = icp.serviceUsage.required.find(
    (required) => !serviceMatches(candidate.observedServices, required),
  );
  if (missingService !== undefined) {
    return {
      candidate,
      reason: "required-service-missing",
      detail: `必須サービス「${missingService}」の利用を公開情報で確認できません。`,
    };
  }

  const excludedService = icp.serviceUsage.excluded.find((excluded) =>
    serviceMatches(candidate.observedServices, excluded),
  );
  if (excludedService !== undefined) {
    return {
      candidate,
      reason: "excluded-service",
      detail: `除外サービス「${excludedService}」の利用を確認したため除外しました。`,
    };
  }

  const explicitExclusion = icp.exclusionConditions.find((condition) =>
    candidate.exclusionTags.some((tag) => valuesMatch(tag, condition)),
  );
  if (explicitExclusion !== undefined) {
    return {
      candidate,
      reason: "explicit-exclusion",
      detail: `除外条件「${explicitExclusion}」に一致しました。`,
    };
  }

  if (!candidateIsInIcpScope(candidate, icp)) {
    return {
      candidate,
      reason: "outside-icp",
      detail: "業種または地域がICPの探索範囲外です。",
    };
  }

  return null;
}

export function discoverCandidates(
  candidates: readonly LeadCandidate[],
  icp: IdealCustomerProfile,
  maxCandidates: number,
): CandidateDiscoveryResult {
  if (!Number.isInteger(maxCandidates) || maxCandidates < 0) {
    throw new Error("maxCandidates は0以上の整数で指定してください。");
  }

  const deduplicated = deduplicateCandidates(candidates);
  const accepted: LeadCandidate[] = [];
  const excluded: ExcludedCandidate[] = [];

  for (const candidate of deduplicated.unique) {
    const exclusion = exclusionFor(candidate, icp);
    if (exclusion !== null) {
      excluded.push(exclusion);
      continue;
    }

    if (accepted.length >= maxCandidates) {
      excluded.push({
        candidate,
        reason: "candidate-limit",
        detail: `候補上限${maxCandidates}件に達したため追加しませんでした。`,
      });
      continue;
    }

    accepted.push(candidate);
  }

  return {
    candidates: accepted,
    excluded,
    duplicates: deduplicated.duplicates,
  };
}
