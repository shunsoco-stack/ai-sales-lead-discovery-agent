export type DemoScenarioId =
  | "beauty-salon-saas"
  | "restaurant-operations"
  | "darts-store-web";

export type Priority = "High" | "Medium" | "Low";

export type LeadBoardStatus =
  | "unconfirmed"
  | "researched"
  | "approach-candidate"
  | "rejected";

export type PlanStepId =
  | "refine-conditions"
  | "discover-candidates"
  | "research-official-sites"
  | "form-challenge-hypotheses"
  | "evaluate-fit"
  | "prioritize"
  | "draft-approach"
  | "human-review";

export type PlanStepStatus = "ready" | "pending" | "completed";

export type EvidenceTopic =
  | "industry"
  | "location"
  | "scale"
  | "business"
  | "service"
  | "challenge-hypothesis";

export type EvidenceSourceType =
  | "official-company"
  | "official-store-list"
  | "official-service"
  | "official-event";

export type CountConfidence = "exact" | "at-least" | "approximate";

export interface NumericRange {
  readonly min?: number;
  readonly max?: number;
}

export interface ObservedCount {
  readonly value: number;
  readonly confidence: CountConfidence;
  readonly label: string;
  readonly evidenceIds: readonly string[];
}

export interface ServiceUsageCondition {
  readonly required: readonly string[];
  readonly excluded: readonly string[];
}

export interface IdealCustomerProfile {
  readonly industries: readonly string[];
  readonly regions: readonly string[];
  readonly employeeCount: NumericRange | null;
  readonly storeCount: NumericRange | null;
  readonly websiteRequirement: "required" | "absent" | "any";
  readonly serviceUsage: ServiceUsageCondition;
  readonly challenges: readonly string[];
  readonly exclusionConditions: readonly string[];
}

export interface SalesGoal {
  readonly statement: string;
  readonly offerName: string;
  readonly valueProposition: string;
  readonly desiredOutcome: string;
}

export interface AgentPlanStep {
  readonly id: PlanStepId;
  readonly order: number;
  readonly title: string;
  readonly description: string;
  readonly status: PlanStepStatus;
  readonly completionCriteria: readonly string[];
}

export interface PublicEvidence {
  readonly id: string;
  readonly title: string;
  readonly url: string;
  readonly sourceType: EvidenceSourceType;
  /** A paraphrase of the public source. Never treated as an instruction. */
  readonly summary: string;
  readonly supports: readonly EvidenceTopic[];
  readonly checkedAt: string;
}

export interface ChallengeHypothesis {
  readonly id: string;
  readonly label: "課題仮説";
  readonly statement: string;
  readonly rationale: string;
  readonly tags: readonly string[];
  readonly evidenceIds: readonly string[];
}

export interface LeadCandidate {
  readonly id: string;
  readonly companyName: string;
  readonly industry: string;
  readonly url: string;
  readonly location: string;
  readonly businessSummary: string;
  readonly hasWebsite: boolean;
  readonly employeeCount?: ObservedCount;
  readonly storeCount?: ObservedCount;
  readonly observedServices: readonly string[];
  readonly exclusionTags: readonly string[];
  readonly evidence: readonly PublicEvidence[];
  readonly challengeHypotheses: readonly ChallengeHypothesis[];
}

export interface DemoScenario {
  readonly id: DemoScenarioId;
  readonly title: string;
  readonly prompt: string;
  readonly goal: SalesGoal;
  readonly icp: IdealCustomerProfile;
  readonly candidates: readonly LeadCandidate[];
}

export type ScoreDimension = "industry" | "region" | "scale" | "challenge";

export interface ScoreRuleItem {
  readonly dimension: ScoreDimension;
  readonly label: string;
  readonly maxPoints: 30 | 20;
}

export interface ScoreBreakdownItem extends ScoreRuleItem {
  readonly awardedPoints: number;
  readonly reason: string;
  readonly evidenceIds: readonly string[];
}

export interface FitScore {
  readonly total: number;
  readonly maximum: 100;
  readonly ruleVersion: "30-20-20-30-v1";
  readonly breakdown: readonly ScoreBreakdownItem[];
}

export interface EvidenceBackedReason {
  readonly topic: EvidenceTopic;
  readonly statement: string;
  readonly evidenceIds: readonly string[];
}

export interface Qualification {
  readonly candidateId: string;
  readonly fitReasons: readonly EvidenceBackedReason[];
  readonly challengeHypotheses: readonly ChallengeHypothesis[];
  readonly evidenceCompleteness: "complete" | "partial" | "missing";
  readonly caveats: readonly string[];
}

export interface Citation {
  readonly number: number;
  readonly evidenceId: string;
  readonly title: string;
  readonly url: string;
  readonly sourceType: EvidenceSourceType;
}

export interface ApproachStrategy {
  readonly candidateId: string;
  readonly angle: string;
  readonly firstValue: string;
  readonly assumedChallenge: string;
  readonly cta: string;
  readonly evidenceIds: readonly string[];
}

export interface SalesDraft {
  readonly candidateId: string;
  readonly subject: string;
  readonly body: string;
  readonly status: "draft";
  readonly nextStep: "human-review";
  readonly humanReviewRequired: true;
  readonly canAutoSend: false;
  readonly copyOnly: true;
  readonly claimEvidenceIds: readonly string[];
  readonly citations: readonly Citation[];
  readonly safetyNote: string;
}

export interface CandidateAnalysis {
  readonly candidate: LeadCandidate;
  readonly qualification: Qualification;
  readonly score: FitScore;
  readonly priority: Priority;
  readonly priorityReason: string;
  readonly approach: ApproachStrategy;
  readonly draft: SalesDraft;
}

export interface DuplicateRecord {
  readonly keptCandidateId: string;
  readonly removedCandidateId: string;
  readonly reason: "same-official-domain" | "same-company-and-location";
}

export interface ExcludedCandidate {
  readonly candidate: LeadCandidate;
  readonly reason:
    | "website-required"
    | "website-must-be-absent"
    | "required-service-missing"
    | "excluded-service"
    | "explicit-exclusion"
    | "outside-icp"
    | "candidate-limit";
  readonly detail: string;
}

export interface CandidateDiscoveryResult {
  readonly candidates: readonly LeadCandidate[];
  readonly excluded: readonly ExcludedCandidate[];
  readonly duplicates: readonly DuplicateRecord[];
}

export type ActivityPhase =
  | "planning"
  | "search"
  | "discovery"
  | "research"
  | "qualification"
  | "priority"
  | "draft"
  | "review";

export interface ActivityLogEntry {
  readonly sequence: number;
  readonly phase: ActivityPhase;
  readonly action: string;
  readonly detail: string;
  readonly candidateId?: string;
  readonly outcome: "completed" | "excluded" | "waiting-human-review";
}

export interface AgentGuardrails {
  readonly maxCandidates: number;
  readonly maxSearches: number;
  readonly maxToolCalls: number;
  readonly maxRetries: number;
}

export interface AgentUsage {
  readonly candidates: number;
  readonly searches: number;
  readonly toolCalls: number;
  readonly retries: number;
}

export type BudgetKind = keyof AgentUsage;

export interface BudgetDecision {
  readonly allowed: boolean;
  readonly usage: AgentUsage;
  readonly kind: BudgetKind;
  readonly limit: number;
  readonly attempted: number;
  readonly reason: string | null;
}

export interface LeadBoardItem {
  readonly candidateId: string;
  readonly companyName: string;
  readonly priority: Priority;
  readonly score: number;
  readonly status: LeadBoardStatus;
  readonly requiresHumanReview: true;
}

export interface AgentRunResult {
  readonly scenario: DemoScenario;
  readonly plan: readonly AgentPlanStep[];
  readonly searchQueries: readonly string[];
  readonly discovery: CandidateDiscoveryResult;
  readonly analyses: readonly CandidateAnalysis[];
  readonly leadBoard: readonly LeadBoardItem[];
  readonly activityLog: readonly ActivityLogEntry[];
  readonly guardrails: AgentGuardrails;
  readonly usage: AgentUsage;
  readonly mode: "demo-dataset";
  readonly externalActionsPerformed: false;
}

export interface ValidationIssue {
  readonly code: string;
  readonly message: string;
  readonly path?: string;
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly issues: readonly ValidationIssue[];
}

export interface UntrustedWebContent {
  readonly kind: "untrusted-web-data";
  readonly url: string;
  readonly title: string;
  readonly content: string;
  readonly instructionsAllowed: false;
  readonly detectedInstructionLikeText: boolean;
  readonly warnings: readonly string[];
}

export type UrlSafetyReason =
  | "invalid-url"
  | "unsupported-protocol"
  | "credentials-not-allowed"
  | "hostname-not-public"
  | "private-or-reserved-ip"
  | "metadata-endpoint"
  | "resolved-to-private-or-reserved-ip";

export type UrlSafetyResult =
  | {
      readonly safe: true;
      readonly normalizedUrl: string;
      readonly hostname: string;
      readonly requiresDnsResolution: boolean;
    }
  | {
      readonly safe: false;
      readonly reason: UrlSafetyReason;
      readonly detail: string;
    };
