import type {
  AgentGuardrails,
  AgentUsage,
  BudgetDecision,
  BudgetKind,
} from "./types";

export const DEFAULT_GUARDRAILS: AgentGuardrails = Object.freeze({
  maxCandidates: 6,
  maxSearches: 8,
  maxToolCalls: 24,
  maxRetries: 2,
});

export const HARD_GUARDRAIL_CAPS: AgentGuardrails = Object.freeze({
  maxCandidates: 50,
  maxSearches: 20,
  maxToolCalls: 60,
  maxRetries: 3,
});

const LIMIT_BY_USAGE_KIND: Readonly<Record<BudgetKind, keyof AgentGuardrails>> = {
  candidates: "maxCandidates",
  searches: "maxSearches",
  toolCalls: "maxToolCalls",
  retries: "maxRetries",
};

export const EMPTY_AGENT_USAGE: AgentUsage = Object.freeze({
  candidates: 0,
  searches: 0,
  toolCalls: 0,
  retries: 0,
});

export function createGuardrails(
  overrides: Partial<AgentGuardrails> = {},
): AgentGuardrails {
  const guardrails: AgentGuardrails = {
    ...DEFAULT_GUARDRAILS,
    ...overrides,
  };

  for (const key of Object.keys(guardrails) as (keyof AgentGuardrails)[]) {
    const value = guardrails[key];
    const hardCap = HARD_GUARDRAIL_CAPS[key];
    if (!Number.isInteger(value) || value < 0 || value > hardCap) {
      throw new Error(`${key} は0〜${hardCap}の整数で指定してください。`);
    }
  }

  return guardrails;
}

/** Pure budget transition. The prior usage object is never mutated. */
export function consumeAgentBudget(
  usage: AgentUsage,
  guardrails: AgentGuardrails,
  kind: BudgetKind,
  amount = 1,
): BudgetDecision {
  if (!Number.isInteger(amount) || amount < 0) {
    throw new Error("使用量は0以上の整数で指定してください。");
  }

  const limitKey = LIMIT_BY_USAGE_KIND[kind];
  const limit = guardrails[limitKey];
  const attempted = usage[kind] + amount;

  if (attempted > limit) {
    return {
      allowed: false,
      usage,
      kind,
      limit,
      attempted,
      reason: `${limitKey}=${limit} を超えるため実行を停止しました。`,
    };
  }

  return {
    allowed: true,
    usage: { ...usage, [kind]: attempted },
    kind,
    limit,
    attempted,
    reason: null,
  };
}

export function assertBudgetAvailable(decision: BudgetDecision): AgentUsage {
  if (!decision.allowed) {
    throw new Error(decision.reason ?? "Agent guardrailにより実行できません。");
  }
  return decision.usage;
}
