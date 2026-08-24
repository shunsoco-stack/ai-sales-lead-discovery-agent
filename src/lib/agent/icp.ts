import type {
  IdealCustomerProfile,
  NumericRange,
  ValidationIssue,
  ValidationResult,
} from "./types";

function uniqueNonEmpty(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function normalizeRange(range: NumericRange | null): NumericRange | null {
  if (range === null) return null;

  return {
    ...(range.min === undefined ? {} : { min: range.min }),
    ...(range.max === undefined ? {} : { max: range.max }),
  };
}

function validateRange(
  range: NumericRange | null,
  path: string,
): ValidationIssue[] {
  if (range === null) return [];

  const issues: ValidationIssue[] = [];
  for (const [key, value] of [
    ["min", range.min],
    ["max", range.max],
  ] as const) {
    if (
      value !== undefined &&
      (!Number.isInteger(value) || !Number.isFinite(value) || value < 0)
    ) {
      issues.push({
        code: "invalid-range-value",
        path: `${path}.${key}`,
        message: `${path}.${key} は0以上の整数で指定してください。`,
      });
    }
  }

  if (
    range.min !== undefined &&
    range.max !== undefined &&
    range.min > range.max
  ) {
    issues.push({
      code: "range-order",
      path,
      message: `${path} の最小値は最大値以下にしてください。`,
    });
  }

  return issues;
}

export function validateIcp(icp: IdealCustomerProfile): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (uniqueNonEmpty(icp.industries).length === 0) {
    issues.push({
      code: "industry-required",
      path: "industries",
      message: "業種を1件以上指定してください。",
    });
  }

  if (uniqueNonEmpty(icp.regions).length === 0) {
    issues.push({
      code: "region-required",
      path: "regions",
      message: "地域を1件以上指定してください。",
    });
  }

  issues.push(...validateRange(icp.employeeCount, "employeeCount"));
  issues.push(...validateRange(icp.storeCount, "storeCount"));

  const requiredServices = new Set(
    uniqueNonEmpty(icp.serviceUsage.required).map((value) => value.toLowerCase()),
  );
  const conflicts = uniqueNonEmpty(icp.serviceUsage.excluded).filter((value) =>
    requiredServices.has(value.toLowerCase()),
  );

  if (conflicts.length > 0) {
    issues.push({
      code: "service-condition-conflict",
      path: "serviceUsage",
      message: `必須と除外の両方に指定されたサービスがあります: ${conflicts.join("、")}`,
    });
  }

  return { valid: issues.length === 0, issues };
}

/**
 * Produces a stable, trimmed ICP value and rejects contradictory conditions.
 * This is intentionally independent from UI forms and network access.
 */
export function createIcp(input: IdealCustomerProfile): IdealCustomerProfile {
  const normalized: IdealCustomerProfile = {
    industries: uniqueNonEmpty(input.industries),
    regions: uniqueNonEmpty(input.regions),
    employeeCount: normalizeRange(input.employeeCount),
    storeCount: normalizeRange(input.storeCount),
    websiteRequirement: input.websiteRequirement,
    serviceUsage: {
      required: uniqueNonEmpty(input.serviceUsage.required),
      excluded: uniqueNonEmpty(input.serviceUsage.excluded),
    },
    challenges: uniqueNonEmpty(input.challenges),
    exclusionConditions: uniqueNonEmpty(input.exclusionConditions),
  };

  const validation = validateIcp(normalized);
  if (!validation.valid) {
    throw new Error(validation.issues.map((issue) => issue.message).join(" "));
  }

  return normalized;
}

export function buildSearchQueries(
  icp: IdealCustomerProfile,
  maxSearches: number,
): readonly string[] {
  if (!Number.isInteger(maxSearches) || maxSearches < 0) {
    throw new Error("maxSearches は0以上の整数で指定してください。");
  }

  const queries: string[] = [];
  for (const region of icp.regions) {
    for (const industry of icp.industries) {
      queries.push(`${region} ${industry} 公式サイト 店舗`);
    }
  }

  for (const challenge of icp.challenges) {
    for (const industry of icp.industries) {
      queries.push(`${industry} ${challenge} 公式`);
    }
  }

  return uniqueNonEmpty(queries).slice(0, maxSearches);
}
