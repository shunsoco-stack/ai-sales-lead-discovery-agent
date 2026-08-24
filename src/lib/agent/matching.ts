import type { IdealCustomerProfile, LeadCandidate, NumericRange, ObservedCount } from "./types";

export function normalizeComparable(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/株式会社|有限会社|合同会社|inc\.?|co\.?[,\s]*ltd\.?/gi, "")
    .replace(/[\s\u3000・･、,。.\-_/（）()]/g, "")
    // Strip only a terminal prefecture suffix. Removing these characters
    // globally makes unrelated names such as 東京都 and 京都府 overlap.
    .replace(/(都|道|府|県)$/g, "");
}

export function valuesMatch(left: string, right: string): boolean {
  const normalizedLeft = normalizeComparable(left);
  const normalizedRight = normalizeComparable(right);
  if (!normalizedLeft || !normalizedRight) return false;
  if (normalizedLeft === "全国" || normalizedRight === "全国") return true;
  return (
    normalizedLeft.includes(normalizedRight) ||
    normalizedRight.includes(normalizedLeft)
  );
}

export function anyValueMatches(
  actualValues: readonly string[],
  expectedValues: readonly string[],
): boolean {
  return expectedValues.some((expected) =>
    actualValues.some((actual) => valuesMatch(actual, expected)),
  );
}

export function observationMatchesRange(
  observation: ObservedCount | undefined,
  range: NumericRange,
): boolean {
  if (observation === undefined) return false;

  if (range.min !== undefined && observation.value < range.min) return false;
  if (range.max !== undefined && observation.value > range.max) return false;

  // An "at least" observation cannot prove any configured upper bound,
  // even when the lower bound is also satisfied.
  if (observation.confidence === "at-least" && range.max !== undefined) {
    return false;
  }

  return true;
}

export function candidateIsInIcpScope(
  candidate: LeadCandidate,
  icp: IdealCustomerProfile,
): boolean {
  return (
    anyValueMatches([candidate.industry], icp.industries) &&
    anyValueMatches([candidate.location], icp.regions)
  );
}
