"use client";

import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Ban,
  BarChart3,
  Bot,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Copy,
  Database,
  ExternalLink,
  FileCheck2,
  FileText,
  Globe2,
  Info,
  Lightbulb,
  Link,
  ListChecks,
  MapPin,
  MessageSquare,
  Network,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Store,
  Target,
} from "lucide-react";
import { useMemo, useState } from "react";

import {
  DEFAULT_GUARDRAILS,
  DEMO_SCENARIOS,
  HARD_GUARDRAIL_CAPS,
  createAgentPlan,
  createIcp,
  runDemoProspecting,
  type ActivityLogEntry,
  type AgentGuardrails,
  type AgentPlanStep,
  type AgentRunResult,
  type CandidateAnalysis,
  type DemoScenario,
  type DemoScenarioId,
  type IdealCustomerProfile,
  type LeadBoardStatus,
  type SalesGoal,
} from "@/lib/agent";

type WorkbenchView = "setup" | "plan" | "board" | "research" | "approach";

type EditableForm = {
  goal: string;
  offerName: string;
  valueProposition: string;
  desiredOutcome: string;
  industries: string;
  regions: string;
  employeeMin: string;
  employeeMax: string;
  storeMin: string;
  storeMax: string;
  websiteRequirement: IdealCustomerProfile["websiteRequirement"];
  requiredServices: string;
  excludedServices: string;
  challenges: string;
  exclusions: string;
};

type DraftEdit = { subject: string; body: string };

const VIEW_ORDER: readonly WorkbenchView[] = [
  "setup",
  "plan",
  "board",
  "research",
  "approach",
];

const STATUS_LABEL: Readonly<Record<LeadBoardStatus, string>> = {
  unconfirmed: "未確認",
  researched: "調査済み",
  "approach-candidate": "アプローチ候補",
  rejected: "見送り",
};

const SOURCE_LABEL = {
  "official-company": "公式企業情報",
  "official-store-list": "公式店舗一覧",
  "official-service": "公式サービス",
  "official-event": "公式イベント",
} as const;

const OUTCOME_LABEL = {
  completed: "完了",
  excluded: "除外",
  "waiting-human-review": "確認待ち",
} as const;

function splitValues(value: string): string[] {
  return value
    .split(/[\n、,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinValues(values: readonly string[]): string {
  return values.join("、");
}

function rangeValue(value: number | undefined): string {
  return value === undefined ? "" : String(value);
}

function optionalInteger(value: string): number | undefined {
  if (value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : undefined;
}

function formFromScenario(scenario: DemoScenario): EditableForm {
  return {
    goal: scenario.goal.statement,
    offerName: scenario.goal.offerName,
    valueProposition: scenario.goal.valueProposition,
    desiredOutcome: scenario.goal.desiredOutcome,
    industries: joinValues(scenario.icp.industries),
    regions: joinValues(scenario.icp.regions),
    employeeMin: rangeValue(scenario.icp.employeeCount?.min),
    employeeMax: rangeValue(scenario.icp.employeeCount?.max),
    storeMin: rangeValue(scenario.icp.storeCount?.min),
    storeMax: rangeValue(scenario.icp.storeCount?.max),
    websiteRequirement: scenario.icp.websiteRequirement,
    requiredServices: joinValues(scenario.icp.serviceUsage.required),
    excludedServices: joinValues(scenario.icp.serviceUsage.excluded),
    challenges: joinValues(scenario.icp.challenges),
    exclusions: joinValues(scenario.icp.exclusionConditions),
  };
}

function formToGoal(form: EditableForm): SalesGoal {
  return {
    statement: form.goal.trim(),
    offerName: form.offerName.trim(),
    valueProposition: form.valueProposition.trim(),
    desiredOutcome: form.desiredOutcome.trim(),
  };
}

function formToIcp(form: EditableForm): IdealCustomerProfile {
  const employeeMin = optionalInteger(form.employeeMin);
  const employeeMax = optionalInteger(form.employeeMax);
  const storeMin = optionalInteger(form.storeMin);
  const storeMax = optionalInteger(form.storeMax);

  return createIcp({
    industries: splitValues(form.industries),
    regions: splitValues(form.regions),
    employeeCount:
      employeeMin === undefined && employeeMax === undefined
        ? null
        : { min: employeeMin, max: employeeMax },
    storeCount:
      storeMin === undefined && storeMax === undefined
        ? null
        : { min: storeMin, max: storeMax },
    websiteRequirement: form.websiteRequirement,
    serviceUsage: {
      required: splitValues(form.requiredServices),
      excluded: splitValues(form.excludedServices),
    },
    challenges: splitValues(form.challenges),
    exclusionConditions: splitValues(form.exclusions),
  });
}

function AgentMark() {
  return (
    <svg
      className="agent-mark-svg"
      viewBox="0 0 48 48"
      role="img"
      aria-label="ターゲット、企業、AIノードを組み合わせたアイコン"
    >
      <circle cx="24" cy="24" r="17.5" fill="none" stroke="currentColor" strokeWidth="2" opacity=".38" />
      <circle cx="24" cy="24" r="10.5" fill="none" stroke="currentColor" strokeWidth="2" opacity=".66" />
      <path d="M18 33V22.8l6-3.7 6 3.7V33M22 33v-5h4v5M21.5 24.5h1M25.5 24.5h1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 6.5V11M41.5 24H37M24 41.5V37M6.5 24H11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="36.7" cy="11.3" r="2.3" fill="currentColor" />
      <circle cx="40.2" cy="16.8" r="1.5" fill="currentColor" opacity=".72" />
      <path d="m28.8 18.2 6.1-5.4 3.9 3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function PriorityBadge({ priority }: { priority: CandidateAnalysis["priority"] }) {
  return (
    <span className={`priority-badge priority-${priority.toLowerCase()}`}>
      <span aria-hidden="true" className="priority-dot" />
      {priority}
    </span>
  );
}

function FieldHelp({ children }: { children: React.ReactNode }) {
  return <span className="field-help">{children}</span>;
}

function ScoreRing({ score, compact = false }: { score: number; compact?: boolean }) {
  const safeScore = Math.max(0, Math.min(100, score));
  return (
    <div
      className={`score-ring${compact ? " score-ring-compact" : ""}`}
      style={{ "--score": `${safeScore * 3.6}deg` } as React.CSSProperties}
      aria-label={`Fit Score ${safeScore}点`}
    >
      <div className="score-ring-inner">
        <strong>{safeScore}</strong>
        <span>/ 100</span>
      </div>
    </div>
  );
}

function EmptyState({ onEdit }: { onEdit: () => void }) {
  return (
    <section className="empty-state panel-card">
      <span className="empty-icon" aria-hidden="true"><Search size={24} /></span>
      <p className="section-kicker">NO MATCH</p>
      <h2>現在のICPに一致する候補がありません</h2>
      <p>条件を少し広げるか、候補上限を確認してからもう一度Planを実行してください。</p>
      <button className="button button-secondary" type="button" onClick={onEdit}>
        <ArrowLeft size={16} /> ICPを編集
      </button>
    </section>
  );
}

export function LeadDiscoveryWorkbench() {
  const initialScenario = DEMO_SCENARIOS[0];
  const [activeScenarioId, setActiveScenarioId] = useState<DemoScenarioId>(
    initialScenario.id,
  );
  const [form, setForm] = useState<EditableForm>(() => formFromScenario(initialScenario));
  const [guardrails, setGuardrails] = useState<AgentGuardrails>(DEFAULT_GUARDRAILS);
  const [view, setView] = useState<WorkbenchView>("setup");
  const [plan, setPlan] = useState<readonly AgentPlanStep[]>([]);
  const [result, setResult] = useState<AgentRunResult | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>("");
  const [boardStatuses, setBoardStatuses] = useState<Record<string, LeadBoardStatus>>({});
  const [draftEdits, setDraftEdits] = useState<Record<string, DraftEdit>>({});
  const [reviewedCandidates, setReviewedCandidates] = useState<Record<string, boolean>>({});
  const [copiedCandidateId, setCopiedCandidateId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("GoalとICPを編集できます。");

  const selectedAnalysis = useMemo(
    () =>
      result?.analyses.find(
        (analysis) => analysis.candidate.id === selectedCandidateId,
      ) ?? result?.analyses[0] ?? null,
    [result, selectedCandidateId],
  );

  const activityLog = useMemo<readonly ActivityLogEntry[]>(() => {
    if (result !== null) return result.activityLog;
    if (plan.length > 0) {
      return [
        {
          sequence: 1,
          phase: "planning",
          action: "Agent Planを作成",
          detail: `${plan.length}ステップをGoalとICPから生成しました。`,
          outcome: "completed",
        },
        {
          sequence: 2,
          phase: "review",
          action: "Human Approvalで停止",
          detail: "候補探索を始める前にPlanの明示承認を待っています。",
          outcome: "waiting-human-review",
        },
      ];
    }
    return [
      {
        sequence: 1,
        phase: "planning",
        action: "Demo Datasetを準備",
        detail: "公開情報をもとに固定した3シナリオを読み込みました。",
        outcome: "completed",
      },
      {
        sequence: 2,
        phase: "review",
        action: "営業Goalを待機",
        detail: "GoalとICPの確定後に、まずAgent Planを作成します。",
        outcome: "waiting-human-review",
      },
    ];
  }, [plan, result]);

  const currentViewIndex = VIEW_ORDER.indexOf(view);
  const furthestViewIndex = result !== null ? 4 : plan.length > 0 ? 1 : 0;

  function invalidateDownstreamState() {
    setPlan([]);
    setResult(null);
    setSelectedCandidateId("");
    setBoardStatuses({});
    setDraftEdits({});
    setReviewedCandidates({});
    setCopiedCandidateId(null);
  }

  function updateForm<Key extends keyof EditableForm>(key: Key, value: EditableForm[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
    if (plan.length > 0 || result !== null) {
      invalidateDownstreamState();
      setAnnouncement("条件を変更したため、以前のPlanと結果を無効化しました。");
    }
    setFormError(null);
  }

  function chooseScenario(scenario: DemoScenario) {
    setActiveScenarioId(scenario.id);
    setForm(formFromScenario(scenario));
    setGuardrails(DEFAULT_GUARDRAILS);
    setView("setup");
    setPlan([]);
    setResult(null);
    setSelectedCandidateId("");
    setBoardStatuses({});
    setDraftEdits({});
    setReviewedCandidates({});
    setCopiedCandidateId(null);
    setFormError(null);
    setAnnouncement(`${scenario.title}のDemo設定を読み込みました。`);
  }

  function updateGuardrail(key: keyof AgentGuardrails, value: string) {
    const parsed = Number(value);
    const safeValue = Number.isFinite(parsed)
      ? Math.min(HARD_GUARDRAIL_CAPS[key], Math.max(0, Math.trunc(parsed)))
      : 0;
    setGuardrails((current) => ({ ...current, [key]: safeValue }));
    if (plan.length > 0 || result !== null) invalidateDownstreamState();
    setAnnouncement("実行上限を変更したため、以前のPlanと結果を無効化しました。");
  }

  function createPlan() {
    try {
      if (!form.goal.trim()) throw new Error("営業Goalを入力してください。");
      if (!form.offerName.trim()) throw new Error("提案サービス名を入力してください。");
      if (!form.valueProposition.trim()) throw new Error("最初に伝える価値を入力してください。");
      if (!form.desiredOutcome.trim()) throw new Error("目指す成果を入力してください。");
      const nextPlan = createAgentPlan(formToGoal(form), formToIcp(form));
      setPlan(nextPlan);
      setResult(null);
      setSelectedCandidateId("");
      setBoardStatuses({});
      setDraftEdits({});
      setReviewedCandidates({});
      setCopiedCandidateId(null);
      setView("plan");
      setFormError(null);
      setAnnouncement(`${nextPlan.length}ステップのAgent Planを作成しました。実行には承認が必要です。`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "入力内容を確認してください。");
      setAnnouncement("入力内容に確認が必要です。");
    }
  }

  function approveAndRun() {
    try {
      const nextResult = runDemoProspecting(activeScenarioId, {
        goal: formToGoal(form),
        icp: formToIcp(form),
        guardrails,
      });
      const firstCandidateId = nextResult.analyses[0]?.candidate.id ?? "";
      setResult(nextResult);
      setPlan(nextResult.plan);
      setSelectedCandidateId(firstCandidateId);
      setBoardStatuses(
        Object.fromEntries(
          nextResult.leadBoard.map((item) => [item.candidateId, item.status]),
        ),
      );
      setDraftEdits(
        Object.fromEntries(
          nextResult.analyses.map((analysis) => [
            analysis.candidate.id,
            { subject: analysis.draft.subject, body: analysis.draft.body },
          ]),
        ),
      );
      setReviewedCandidates({});
      setCopiedCandidateId(null);
      setView("board");
      setFormError(null);
      setAnnouncement(
        `探索が完了しました。${nextResult.analyses.length}件をLead Boardへ追加し、外部Actionは実行していません。`,
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Agentを実行できませんでした。");
      setView("setup");
      setAnnouncement("Agent実行前に入力内容の修正が必要です。");
    }
  }

  function navigateTo(nextView: WorkbenchView) {
    const nextIndex = VIEW_ORDER.indexOf(nextView);
    const available =
      nextView === "setup" ||
      (nextView === "plan" && plan.length > 0) ||
      (nextIndex >= 2 && result !== null && selectedAnalysis !== null);
    if (!available) return;
    setView(nextView);
    setAnnouncement(`${nextView === "board" ? "Lead Board" : nextView === "research" ? "Company Research" : nextView === "approach" ? "Approach Draft" : nextView === "plan" ? "Agent Plan" : "GoalとICP"}を表示しました。`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openCandidate(candidateId: string, target: "research" | "approach" = "research") {
    setSelectedCandidateId(candidateId);
    setCopiedCandidateId(null);
    setView(target);
    const companyName = result?.analyses.find(
      (analysis) => analysis.candidate.id === candidateId,
    )?.candidate.companyName;
    setAnnouncement(`${companyName ?? "候補企業"}の${target === "research" ? "Company Research" : "Approach Draft"}を表示しました。`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function changeBoardStatus(candidateId: string, status: LeadBoardStatus) {
    setBoardStatuses((current) => ({ ...current, [candidateId]: status }));
    setAnnouncement(`Lead Boardのステージを「${STATUS_LABEL[status]}」へ更新しました。`);
  }

  function updateDraft(candidateId: string, key: keyof DraftEdit, value: string) {
    setDraftEdits((current) => ({
      ...current,
      [candidateId]: {
        ...(current[candidateId] ?? { subject: "", body: "" }),
        [key]: value,
      },
    }));
    setReviewedCandidates((current) => ({ ...current, [candidateId]: false }));
    setCopiedCandidateId(null);
  }

  async function copyDraft(analysis: CandidateAnalysis) {
    const edit = draftEdits[analysis.candidate.id] ?? {
      subject: analysis.draft.subject,
      body: analysis.draft.body,
    };
    const copyText = `件名: ${edit.subject}\n\n${edit.body}`;
    try {
      await navigator.clipboard.writeText(copyText);
      setCopiedCandidateId(analysis.candidate.id);
      changeBoardStatus(analysis.candidate.id, "approach-candidate");
      setAnnouncement("Human Review済みのDraftをクリップボードへコピーしました。送信はしていません。");
    } catch {
      setAnnouncement("コピーできませんでした。ブラウザのクリップボード権限を確認してください。");
    }
  }

  const highCount = result?.analyses.filter((analysis) => analysis.priority === "High").length ?? 0;
  const averageScore = result && result.analyses.length > 0
    ? Math.round(result.analyses.reduce((sum, analysis) => sum + analysis.score.total, 0) / result.analyses.length)
    : 0;

  return (
    <div className="app-shell">
      <a className="skip-link" href="#workbench-main">メインコンテンツへ移動</a>

      <header className="app-header">
        <div className="topbar">
          <div className="brand-lockup">
            <span className="agent-mark"><AgentMark /></span>
            <div className="brand-copy">
              <span>AIエージェント · 営業・リード獲得エージェント</span>
              <strong>AI営業リード発掘エージェント</strong>
            </div>
          </div>
          <div className="header-signals" aria-label="実行モードと安全状態">
            <span className="signal-chip signal-demo"><Database size={15} /> Demo Dataset</span>
            <span className="signal-chip"><ShieldCheck size={15} /> 外部送信なし</span>
          </div>
        </div>
        <div className="demo-notice" role="note">
          <div>
            <Info size={16} aria-hidden="true" />
            <p><strong>Demo Datasetで実行中</strong><span>固定された公開Sourceを使い、Workflowを再現します。リアルタイムWeb検索ではありません。</span></p>
          </div>
          <span className="guardrail-summary">最大 {guardrails.maxCandidates}候補 · {guardrails.maxSearches}検索 · {guardrails.maxToolCalls} Tool Call · Retry {guardrails.maxRetries}</span>
        </div>
      </header>

      <div className="workbench-layout">
        <aside className="workflow-rail" aria-label="Prospecting Workflow">
          <div className="rail-heading">
            <span className="rail-heading-icon"><Network size={17} /></span>
            <div><span>PROSPECTING</span><strong>Workflow</strong></div>
          </div>
          <nav className="workflow-nav" aria-label="ワークフロー画面">
            {[
              { id: "setup" as const, label: "Goal & ICP", detail: "条件を設計", icon: Target },
              { id: "plan" as const, label: "Agent Plan", detail: "実行前に承認", icon: ListChecks },
              { id: "board" as const, label: "Lead Board", detail: "優先順位を管理", icon: BarChart3 },
              { id: "research" as const, label: "Research", detail: "根拠を検証", icon: Building2 },
              { id: "approach" as const, label: "Approach", detail: "Draftを確認", icon: MessageSquare },
            ].map((item, index) => {
              const Icon = item.icon;
              const available = index <= furthestViewIndex || (result !== null && index >= 2);
              const active = item.id === view;
              const complete = index < currentViewIndex || (result !== null && index < 2);
              return (
                <button
                  className={`workflow-nav-item${active ? " is-active" : ""}${complete ? " is-complete" : ""}`}
                  type="button"
                  key={item.id}
                  onClick={() => navigateTo(item.id)}
                  disabled={!available}
                  aria-current={active ? "step" : undefined}
                >
                  <span className="nav-icon"><Icon size={17} /></span>
                  <span className="nav-copy"><strong>{item.label}</strong><small>{item.detail}</small></span>
                  <span className="nav-state" aria-hidden="true">
                    {complete ? <Check size={14} /> : <span>{index + 1}</span>}
                  </span>
                </button>
              );
            })}
          </nav>
          <div className="rail-safety">
            <ShieldCheck size={17} />
            <div><strong>Human-in-the-loop</strong><span>外部Actionは必ず人が判断</span></div>
          </div>
        </aside>

        <main className="workspace-main" id="workbench-main">
          <div className="sr-only" role="status" aria-live="polite">{announcement}</div>

          {view === "setup" && (
            <div className="view-stack setup-view">
              <section className="view-hero">
                <div>
                  <p className="section-kicker"><span>01</span> SALES GOAL & ICP</p>
                  <h1>狙う相手を決めてから、<br />エージェントを動かす。</h1>
                  <p>営業目的を、探索・除外・評価に使えるIdeal Customer Profileへ構造化します。</p>
                </div>
                <div className="hero-state">
                  <span className="hero-state-icon"><Sparkles size={18} /></span>
                  <div><span>現在のステップ</span><strong>条件設計</strong></div>
                </div>
              </section>

              <section className="panel-card preset-panel" aria-labelledby="demo-presets-title">
                <div className="panel-heading compact-heading">
                  <div><p className="section-kicker">DEMO PRESETS</p><h2 id="demo-presets-title">シナリオから始める</h2></div>
                  <span className="quiet-badge"><Database size={14} /> 3 datasets</span>
                </div>
                <div className="preset-grid">
                  {DEMO_SCENARIOS.map((scenario, index) => (
                    <button
                      className={`preset-card${activeScenarioId === scenario.id ? " is-selected" : ""}`}
                      type="button"
                      key={scenario.id}
                      onClick={() => chooseScenario(scenario)}
                      aria-pressed={activeScenarioId === scenario.id}
                    >
                      <span className="preset-number">0{index + 1}</span>
                      <span className="preset-icon" aria-hidden="true">
                        {index === 0 ? <Sparkles size={19} /> : index === 1 ? <Store size={19} /> : <Target size={19} />}
                      </span>
                      <strong>{scenario.title}</strong>
                      <span>{scenario.prompt}</span>
                      <span className="preset-action">設定を読み込む <ChevronRight size={14} /></span>
                    </button>
                  ))}
                </div>
              </section>

              <section className="panel-card goal-panel" aria-labelledby="sales-goal-title">
                <div className="panel-heading">
                  <div className="heading-with-icon">
                    <span className="section-icon section-icon-blue"><Target size={19} /></span>
                    <div><p className="section-kicker">SALES GOAL</p><h2 id="sales-goal-title">営業Goal</h2></div>
                  </div>
                  <span className="editable-chip"><Settings2 size={14} /> 編集可能</span>
                </div>
                <label className="field field-full">
                  <span className="field-label">誰に、何を提案したいですか？ <em>必須</em></span>
                  <textarea
                    className="goal-textarea"
                    rows={3}
                    value={form.goal}
                    onChange={(event) => updateForm("goal", event.target.value)}
                    placeholder="例：東京都内の美容室へ、店舗運営SaaSを販売したい"
                  />
                  <FieldHelp>この文章からPlanを組み立てます。候補探索より先に確定します。</FieldHelp>
                </label>
                <div className="form-grid three-columns">
                  <label className="field">
                    <span className="field-label">提案サービス名 <em>必須</em></span>
                    <input value={form.offerName} onChange={(event) => updateForm("offerName", event.target.value)} />
                  </label>
                  <label className="field">
                    <span className="field-label">最初に伝える価値 <em>必須</em></span>
                    <input value={form.valueProposition} onChange={(event) => updateForm("valueProposition", event.target.value)} />
                  </label>
                  <label className="field">
                    <span className="field-label">目指す成果 <em>必須</em></span>
                    <input value={form.desiredOutcome} onChange={(event) => updateForm("desiredOutcome", event.target.value)} />
                  </label>
                </div>
              </section>

              <section className="panel-card icp-panel" aria-labelledby="icp-title">
                <div className="panel-heading">
                  <div className="heading-with-icon">
                    <span className="section-icon section-icon-violet"><SlidersHorizontal size={19} /></span>
                    <div><p className="section-kicker">IDEAL CUSTOMER PROFILE</p><h2 id="icp-title">ターゲット条件</h2></div>
                  </div>
                  <span className="logic-chip">探索条件 + 除外条件</span>
                </div>
                <div className="form-grid two-columns">
                  <label className="field">
                    <span className="field-label">業種 <em>必須</em></span>
                    <input value={form.industries} onChange={(event) => updateForm("industries", event.target.value)} placeholder="美容室、ヘアサロン" />
                    <FieldHelp>複数指定は「、」区切り</FieldHelp>
                  </label>
                  <label className="field">
                    <span className="field-label">地域 <em>必須</em></span>
                    <input value={form.regions} onChange={(event) => updateForm("regions", event.target.value)} placeholder="東京都、神奈川県" />
                    <FieldHelp>都道府県・市区町村・全国に対応</FieldHelp>
                  </label>

                  <fieldset className="field range-fieldset">
                    <legend className="field-label">従業員規模</legend>
                    <div className="range-row">
                      <label><span className="sr-only">従業員数の最小値</span><input type="number" min="0" value={form.employeeMin} onChange={(event) => updateForm("employeeMin", event.target.value)} placeholder="下限なし" /></label>
                      <span>〜</span>
                      <label><span className="sr-only">従業員数の最大値</span><input type="number" min="0" value={form.employeeMax} onChange={(event) => updateForm("employeeMax", event.target.value)} placeholder="上限なし" /></label>
                      <span>名</span>
                    </div>
                  </fieldset>
                  <fieldset className="field range-fieldset">
                    <legend className="field-label">店舗数</legend>
                    <div className="range-row">
                      <label><span className="sr-only">店舗数の最小値</span><input type="number" min="0" value={form.storeMin} onChange={(event) => updateForm("storeMin", event.target.value)} placeholder="下限なし" /></label>
                      <span>〜</span>
                      <label><span className="sr-only">店舗数の最大値</span><input type="number" min="0" value={form.storeMax} onChange={(event) => updateForm("storeMax", event.target.value)} placeholder="上限なし" /></label>
                      <span>店</span>
                    </div>
                  </fieldset>

                  <label className="field">
                    <span className="field-label">Webサイト</span>
                    <select value={form.websiteRequirement} onChange={(event) => updateForm("websiteRequirement", event.target.value as IdealCustomerProfile["websiteRequirement"])}>
                      <option value="required">公式サイトあり（必須）</option>
                      <option value="any">条件に含めない</option>
                      <option value="absent">公式サイトなし</option>
                    </select>
                  </label>
                  <label className="field">
                    <span className="field-label">特定サービス利用あり</span>
                    <input value={form.requiredServices} onChange={(event) => updateForm("requiredServices", event.target.value)} placeholder="例：公式イベント検索" />
                    <FieldHelp>公開Sourceで確認できる場合のみ適合</FieldHelp>
                  </label>

                  <label className="field field-full">
                    <span className="field-label">想定する課題</span>
                    <textarea rows={2} value={form.challenges} onChange={(event) => updateForm("challenges", event.target.value)} />
                    <FieldHelp>候補企業の課題とは断定せず、公開情報に紐づく「課題仮説」として評価します。</FieldHelp>
                  </label>
                  <label className="field">
                    <span className="field-label">除外するサービス</span>
                    <input value={form.excludedServices} onChange={(event) => updateForm("excludedServices", event.target.value)} placeholder="例：競合サービス名" />
                  </label>
                  <label className="field">
                    <span className="field-label">除外条件</span>
                    <input value={form.exclusions} onChange={(event) => updateForm("exclusions", event.target.value)} placeholder="例：単店舗のみ" />
                  </label>
                </div>
              </section>

              <section className="panel-card guardrail-panel" aria-labelledby="guardrails-title">
                <div className="panel-heading">
                  <div className="heading-with-icon">
                    <span className="section-icon section-icon-green"><ShieldCheck size={19} /></span>
                    <div><p className="section-kicker">EXECUTION GUARDRAILS</p><h2 id="guardrails-title">実行上限</h2></div>
                  </div>
                  <span className="safe-chip"><CheckCircle2 size={14} /> Hard capあり</span>
                </div>
                <div className="guardrail-grid">
                  {[
                    { key: "maxCandidates" as const, label: "最大候補数", suffix: "社", icon: Building2 },
                    { key: "maxSearches" as const, label: "最大Search数", suffix: "回", icon: Search },
                    { key: "maxToolCalls" as const, label: "最大Tool Call数", suffix: "回", icon: Settings2 },
                    { key: "maxRetries" as const, label: "Retry上限", suffix: "回", icon: Clock3 },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <label className="guardrail-control" key={item.key}>
                        <span className="guardrail-icon"><Icon size={17} /></span>
                        <span className="guardrail-copy"><strong>{item.label}</strong><small>上限 {HARD_GUARDRAIL_CAPS[item.key]}{item.suffix}</small></span>
                        <span className="guardrail-input"><input type="number" min="0" max={HARD_GUARDRAIL_CAPS[item.key]} value={guardrails[item.key]} onChange={(event) => updateGuardrail(item.key, event.target.value)} aria-label={item.label} /><small>{item.suffix}</small></span>
                      </label>
                    );
                  })}
                </div>
                <div className="security-strip">
                  <span><ShieldCheck size={16} /> SSRF対策: localhost・private IP・metadata endpointをBlock</span>
                  <span><Ban size={16} /> Web ContentはInstructionではなくDataとして扱う</span>
                </div>
              </section>

              {formError && <div className="inline-error" role="alert"><Info size={17} />{formError}</div>}

              <section className="setup-cta panel-card">
                <div>
                  <p className="section-kicker">NEXT STEP</p>
                  <h2>まずPlanを確認します</h2>
                  <p>この操作では候補探索を開始しません。生成された8ステップを確認してから、明示的に承認できます。</p>
                </div>
                <button className="button button-primary button-large" type="button" onClick={createPlan}>
                  Agent Planを作成 <ArrowRight size={17} />
                </button>
              </section>
            </div>
          )}

          {view === "plan" && (
            <div className="view-stack plan-view">
              <section className="view-hero plan-hero">
                <div>
                  <p className="section-kicker"><span>02</span> AGENT PLANNING</p>
                  <h1>{result === null ? <>探索より先に、<br />進め方を合意する。</> : <>合意したPlanと、<br />実行結果をつなぐ。</>}</h1>
                  <p>{result === null ? "GoalとICPから実行Planを作成しました。まだ候補探索は始めていません。" : "このPlanは承認済みです。自動処理を完了し、Human Review待ちで停止しています。"}</p>
                </div>
                {result === null ? <span className="approval-state"><Clock3 size={17} /> 承認待ち</span> : <span className="approval-state"><FileCheck2 size={17} /> 承認済み · Review待ち</span>}
              </section>

              <section className="panel-card plan-card" aria-labelledby="agent-plan-title">
                <div className="panel-heading">
                  <div><p className="section-kicker">PROPOSED PLAN</p><h2 id="agent-plan-title">Agent Plan</h2></div>
                  <span className="quiet-badge"><ListChecks size={14} /> {plan.length} steps</span>
                </div>
                <ol className="plan-list">
                  {plan.map((step, index) => (
                    <li className="plan-step" key={step.id}>
                      <div className="plan-marker"><span>{String(step.order).padStart(2, "0")}</span>{index < plan.length - 1 && <i />}</div>
                      <div className="plan-step-content">
                        <div className="plan-step-title"><h3>{step.title}</h3><span className={result !== null ? step.id === "human-review" ? "step-review" : "step-complete" : step.status === "ready" ? "step-ready" : "step-pending"}>{result !== null ? step.id === "human-review" ? "Review待ち" : "Completed" : step.status === "ready" ? "Ready" : "Pending"}</span></div>
                        <p>{step.description}</p>
                        <div className="criteria-list" aria-label="完了条件">
                          {step.completionCriteria.map((criterion) => <span key={criterion}><Check size={13} /> {criterion}</span>)}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>

              <div className="plan-insight-grid">
                <section className="panel-card score-rule-card" aria-labelledby="score-rule-title">
                  <div className="mini-card-heading"><span className="section-icon section-icon-blue"><BarChart3 size={18} /></span><div><p className="section-kicker">FIT RULE</p><h2 id="score-rule-title">100点の根拠を固定</h2></div></div>
                  <div className="score-rule-bars" aria-label="Fit Score配点">
                    {[
                      ["業種適合", 30, "score-blue"],
                      ["地域", 20, "score-cyan"],
                      ["規模", 20, "score-violet"],
                      ["課題一致", 30, "score-amber"],
                    ].map(([label, points, className]) => (
                      <div className="score-rule-row" key={String(label)}><span>{label}</span><div><i className={String(className)} style={{ width: `${Number(points) * 3.1}%` }} /></div><strong>{points}点</strong></div>
                    ))}
                  </div>
                  <p className="card-footnote"><Info size={14} /> 理由のないAI採点は行いません。各配点を公開Sourceと照合します。</p>
                </section>
                <section className="panel-card boundary-card" aria-labelledby="boundary-title">
                  <div className="mini-card-heading"><span className="section-icon section-icon-green"><ShieldCheck size={18} /></span><div><p className="section-kicker">ACTION BOUNDARY</p><h2 id="boundary-title">止まる場所を明示</h2></div></div>
                  <ul className="boundary-list">
                    <li><CheckCircle2 size={16} /><span><strong>実行する</strong> 検索条件化・候補評価・Draft作成</span></li>
                    <li><Ban size={16} /><span><strong>実行しない</strong> メール・DM・フォーム送信</span></li>
                    <li><FileCheck2 size={16} /><span><strong>最後に停止</strong> Human Review → Copy</span></li>
                  </ul>
                </section>
              </div>

              <section className={`approval-card${result !== null ? " approval-card-complete" : ""}`}>
                <div className="approval-glow" aria-hidden="true" />
                <span className="approval-icon">{result === null ? <Bot size={22} /> : <CheckCircle2 size={22} />}</span>
                <div className="approval-copy">
                  <p className="section-kicker">{result === null ? "HUMAN APPROVAL" : "PLAN COMPLETED"}</p>
                  <h2>{result === null ? "このPlanでDemo探索を実行しますか？" : "Planの自動処理を完了しました"}</h2>
                  <p>{result === null ? "承認後、固定Demo Datasetの候補を調査・評価し、Human Review直前で停止します。" : `${result.analyses.length}件を評価し、外部Actionを行わずHuman Review待ちで停止しました。`}</p>
                </div>
                <div className="approval-actions">
                  {result === null ? <>
                    <button className="button button-secondary" type="button" onClick={() => navigateTo("setup")}><ArrowLeft size={16} /> 条件を編集</button>
                    <button className="button button-primary button-large" type="button" onClick={approveAndRun}><Check size={17} /> Planを承認して実行</button>
                  </> : <>
                    <button className="button button-secondary" type="button" onClick={() => navigateTo("setup")}><Settings2 size={16} /> 条件を確認</button>
                    <button className="button button-primary button-large" type="button" onClick={() => navigateTo("board")}>Lead Boardへ <ArrowRight size={17} /></button>
                  </>}
                </div>
              </section>
            </div>
          )}

          {view === "board" && result !== null && (
            <div className="view-stack results-view">
              <section className="view-hero results-hero">
                <div>
                  <p className="section-kicker"><span>03</span> DISCOVERY & PRIORITY</p>
                  <h1>根拠の濃い候補から、<br />次の一手を選ぶ。</h1>
                  <p>{result.scenario.goal.statement}</p>
                </div>
                <span className="run-complete"><CheckCircle2 size={17} /> Agent完了</span>
              </section>

              <section className="metric-grid" aria-label="探索結果サマリー">
                <article className="metric-card"><span className="metric-icon metric-blue"><Building2 size={19} /></span><div><span>Qualified leads</span><strong>{result.analyses.length}<small>社</small></strong><p>{result.discovery.excluded.length}社を条件外として記録</p></div></article>
                <article className="metric-card"><span className="metric-icon metric-green"><Target size={19} /></span><div><span>High priority</span><strong>{highCount}<small>社</small></strong><p>High {80}点以上 + Evidence充足</p></div></article>
                <article className="metric-card"><span className="metric-icon metric-violet"><BarChart3 size={19} /></span><div><span>Average Fit</span><strong>{averageScore}<small>/100</small></strong><p>30 / 20 / 20 / 30 の固定配点</p></div></article>
                <article className="metric-card"><span className="metric-icon metric-amber"><Settings2 size={19} /></span><div><span>Tool budget</span><strong>{result.usage.searches}<small>/{result.guardrails.maxSearches}</small></strong><p>Search上限内 · Retry {result.usage.retries}</p></div></article>
              </section>

              <section className="panel-card lead-board-card" aria-labelledby="lead-board-title">
                <div className="panel-heading board-heading">
                  <div><p className="section-kicker">QUALIFIED PIPELINE</p><h2 id="lead-board-title">Lead Board</h2><p>優先順位、Fitの内訳、現在のステージを一か所で管理します。</p></div>
                  <div className="score-legend" aria-label="Fit Scoreルール"><span><i className="legend-blue" />業種 30</span><span><i className="legend-cyan" />地域 20</span><span><i className="legend-violet" />規模 20</span><span><i className="legend-amber" />課題 30</span></div>
                </div>
                {result.analyses.length === 0 ? (
                  <EmptyState onEdit={() => navigateTo("setup")} />
                ) : (
                  <div className="lead-table-wrap">
                    <table className="lead-table">
                      <thead><tr><th>企業</th><th>Fit Score</th><th>Priority</th><th>ステージ</th><th><span className="sr-only">詳細</span></th></tr></thead>
                      <tbody>
                        {result.analyses.map((analysis, index) => (
                          <tr key={analysis.candidate.id}>
                            <td>
                              <button className="company-cell" type="button" onClick={() => openCandidate(analysis.candidate.id)}>
                                <span className="company-rank">{String(index + 1).padStart(2, "0")}</span>
                                <span className="company-avatar"><Building2 size={18} /></span>
                                <span><strong>{analysis.candidate.companyName}</strong><small><MapPin size={12} /> {analysis.candidate.location}</small><small>{analysis.candidate.industry}</small></span>
                              </button>
                            </td>
                            <td>
                              <div className="table-score">
                                <strong>{analysis.score.total}</strong><span>/100</span>
                                <div className="score-segments" aria-label={`内訳 ${analysis.score.breakdown.map((item) => `${item.label}${item.awardedPoints}点`).join("、")}`}>
                                  {analysis.score.breakdown.map((item, scoreIndex) => <i key={item.dimension} className={`segment-${scoreIndex}`} style={{ width: `${item.awardedPoints}%` }} title={`${item.label} ${item.awardedPoints}/${item.maxPoints}`} />)}
                                </div>
                                <small>{analysis.score.breakdown.map((item) => item.awardedPoints).join(" · ")}</small>
                              </div>
                            </td>
                            <td><PriorityBadge priority={analysis.priority} /><p className="priority-reason">{analysis.priorityReason.split("。")[0]}</p></td>
                            <td>
                              <label className="stage-select-label"><span className="sr-only">{analysis.candidate.companyName}のステージ</span><select className={`stage-select stage-${boardStatuses[analysis.candidate.id] ?? "researched"}`} value={boardStatuses[analysis.candidate.id] ?? "researched"} onChange={(event) => changeBoardStatus(analysis.candidate.id, event.target.value as LeadBoardStatus)}><option value="unconfirmed">未確認</option><option value="researched">調査済み</option><option value="approach-candidate">アプローチ候補</option><option value="rejected">見送り</option></select></label>
                            </td>
                            <td><button className="icon-button" type="button" aria-label={`${analysis.candidate.companyName}の調査結果を見る`} onClick={() => openCandidate(analysis.candidate.id)}><ChevronRight size={17} /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className="search-trace panel-card" aria-labelledby="search-trace-title">
                <div className="mini-card-heading"><span className="section-icon section-icon-blue"><Search size={18} /></span><div><p className="section-kicker">SEARCH TRACE</p><h2 id="search-trace-title">適用した検索条件</h2></div></div>
                <div className="query-list">{result.searchQueries.map((query, index) => <span key={query}><small>Q{index + 1}</small>{query}</span>)}</div>
                <p className="card-footnote"><Database size={14} /> 各クエリを固定Demo Datasetへ適用。リアルタイム検索とは表示していません。</p>
              </section>
            </div>
          )}

          {view === "research" && selectedAnalysis !== null && result !== null && (
            <div className="view-stack research-view">
              <div className="detail-toolbar">
                <button className="button button-ghost" type="button" onClick={() => navigateTo("board")}><ArrowLeft size={16} /> Lead Board</button>
                <div className="detail-tabs" role="tablist" aria-label="候補企業の詳細">
                  <button type="button" role="tab" aria-selected="true" className="is-active" onClick={() => navigateTo("research")}><Building2 size={15} /> Research</button>
                  <button type="button" role="tab" aria-selected="false" onClick={() => navigateTo("approach")}><MessageSquare size={15} /> Approach</button>
                </div>
                <label className="candidate-switch"><span className="sr-only">表示する候補企業</span><select value={selectedAnalysis.candidate.id} onChange={(event) => openCandidate(event.target.value)}>{result.analyses.map((analysis) => <option key={analysis.candidate.id} value={analysis.candidate.id}>{analysis.candidate.companyName}</option>)}</select></label>
              </div>

              <section className="company-hero panel-card">
                <div className="company-identity">
                  <span className="company-large-avatar"><Building2 size={26} /></span>
                  <div><div className="company-label-row"><span>COMPANY RESEARCH</span><PriorityBadge priority={selectedAnalysis.priority} /></div><h1>{selectedAnalysis.candidate.companyName}</h1><p>{selectedAnalysis.candidate.businessSummary}</p></div>
                </div>
                <div className="company-meta">
                  <span><Store size={15} /> {selectedAnalysis.candidate.industry}</span>
                  <span><MapPin size={15} /> {selectedAnalysis.candidate.location}</span>
                  <a href={selectedAnalysis.candidate.url} target="_blank" rel="noreferrer"><Globe2 size={15} /> 公式サイト <ExternalLink size={13} /></a>
                </div>
              </section>

              <div className="research-layout">
                <div className="research-main-column">
                  <section className="panel-card qualification-card" aria-labelledby="qualification-title">
                    <div className="panel-heading"><div className="heading-with-icon"><span className="section-icon section-icon-green"><CheckCircle2 size={19} /></span><div><p className="section-kicker">QUALIFICATION</p><h2 id="qualification-title">営業対象として適合する理由</h2></div></div><span className={`evidence-status evidence-${selectedAnalysis.qualification.evidenceCompleteness}`}>Evidence {selectedAnalysis.qualification.evidenceCompleteness}</span></div>
                    <div className="fit-reason-list">
                      {selectedAnalysis.qualification.fitReasons.map((reason, index) => (
                        <article key={`${reason.topic}-${index}`}><span className="reason-index">{String(index + 1).padStart(2, "0")}</span><div><small>{reason.topic.toUpperCase()}</small><strong>{reason.statement}</strong><span className="citation-chips">{reason.evidenceIds.map((evidenceId) => { const sourceIndex = selectedAnalysis.candidate.evidence.findIndex((item) => item.id === evidenceId); return <a href={`#source-${evidenceId}`} key={evidenceId}>Source {sourceIndex + 1}</a>; })}</span></div></article>
                      ))}
                    </div>
                    <div className="caveat-note"><Info size={17} /><div><strong>評価上の注意</strong>{selectedAnalysis.qualification.caveats.map((caveat) => <p key={caveat}>{caveat}</p>)}</div></div>
                  </section>

                  <section className="panel-card evidence-card" aria-labelledby="evidence-title">
                    <div className="panel-heading"><div className="heading-with-icon"><span className="section-icon section-icon-blue"><Link size={19} /></span><div><p className="section-kicker">PUBLIC EVIDENCE</p><h2 id="evidence-title">公開観測とSource</h2></div></div><span className="quiet-badge"><Globe2 size={14} /> {selectedAnalysis.candidate.evidence.length} sources</span></div>
                    <div className="evidence-list">
                      {selectedAnalysis.candidate.evidence.map((evidence, index) => (
                        <article className="evidence-item" id={`source-${evidence.id}`} key={evidence.id}>
                          <div className="source-number">S{index + 1}</div>
                          <div className="source-content">
                            <div className="source-title-row"><div><span className="source-type">{SOURCE_LABEL[evidence.sourceType]}</span><h3>{evidence.title}</h3></div><a className="source-link" href={evidence.url} target="_blank" rel="noreferrer" aria-label={`${evidence.title}を新しいタブで開く`}><ExternalLink size={16} /></a></div>
                            <p>{evidence.summary}</p>
                            <div className="source-meta"><span><Globe2 size={13} /> {new URL(evidence.url).hostname}</span><span><Clock3 size={13} /> 確認 {evidence.checkedAt}</span></div>
                            <div className="supports-list">{evidence.supports.map((support) => <span key={support}>{support}</span>)}</div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>

                  <section className="panel-card hypothesis-card" aria-labelledby="hypothesis-title">
                    <div className="panel-heading"><div className="heading-with-icon"><span className="section-icon section-icon-amber"><Lightbulb size={19} /></span><div><p className="section-kicker">INFERENCE, NOT FACT</p><h2 id="hypothesis-title">課題仮説</h2></div></div><span className="hypothesis-label">断定しない</span></div>
                    <div className="hypothesis-list">
                      {selectedAnalysis.qualification.challengeHypotheses.map((hypothesis, index) => (
                        <article key={hypothesis.id}><div className="hypothesis-head"><span>課題仮説 {index + 1}</span><div>{hypothesis.evidenceIds.map((evidenceId) => { const sourceIndex = selectedAnalysis.candidate.evidence.findIndex((item) => item.id === evidenceId); return <a href={`#source-${evidenceId}`} key={evidenceId}>S{sourceIndex + 1}</a>; })}</div></div><h3>{hypothesis.statement}</h3><p>{hypothesis.rationale}</p><div className="tag-list">{hypothesis.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></article>
                      ))}
                    </div>
                  </section>
                </div>

                <aside className="research-score-column" aria-labelledby="fit-score-title">
                  <section className="panel-card fit-score-card">
                    <p className="section-kicker">FIT SCORE</p>
                    <h2 id="fit-score-title">適合度</h2>
                    <ScoreRing score={selectedAnalysis.score.total} />
                    <PriorityBadge priority={selectedAnalysis.priority} />
                    <div className="breakdown-list">
                      {selectedAnalysis.score.breakdown.map((item, index) => (
                        <div key={item.dimension}><div><span>{item.label}</span><strong>{item.awardedPoints}<small>/{item.maxPoints}</small></strong></div><span className="breakdown-track"><i className={`breakdown-${index}`} style={{ width: `${(item.awardedPoints / item.maxPoints) * 100}%` }} /></span><p>{item.reason}</p></div>
                      ))}
                    </div>
                    <div className="priority-explanation"><strong>Priorityの理由</strong><p>{selectedAnalysis.priorityReason}</p></div>
                  </section>
                  <button className="button button-primary button-full" type="button" onClick={() => navigateTo("approach")}>Approachを確認 <ArrowRight size={16} /></button>
                </aside>
              </div>
            </div>
          )}

          {view === "approach" && selectedAnalysis !== null && result !== null && (
            <div className="view-stack approach-view">
              <div className="detail-toolbar">
                <button className="button button-ghost" type="button" onClick={() => navigateTo("board")}><ArrowLeft size={16} /> Lead Board</button>
                <div className="detail-tabs" role="tablist" aria-label="候補企業の詳細">
                  <button type="button" role="tab" aria-selected="false" onClick={() => navigateTo("research")}><Building2 size={15} /> Research</button>
                  <button type="button" role="tab" aria-selected="true" className="is-active" onClick={() => navigateTo("approach")}><MessageSquare size={15} /> Approach</button>
                </div>
                <label className="candidate-switch"><span className="sr-only">表示する候補企業</span><select value={selectedAnalysis.candidate.id} onChange={(event) => openCandidate(event.target.value, "approach")}>{result.analyses.map((analysis) => <option key={analysis.candidate.id} value={analysis.candidate.id}>{analysis.candidate.companyName}</option>)}</select></label>
              </div>

              <section className="view-hero approach-hero">
                <div>
                  <p className="section-kicker"><span>05</span> APPROACH STRATEGY</p>
                  <h1>{selectedAnalysis.candidate.companyName}へ、<br />根拠を保った最初の接点を。</h1>
                  <p>公開観測と課題仮説を分けたまま、押しつけないアプローチへ変換します。</p>
                </div>
                <PriorityBadge priority={selectedAnalysis.priority} />
              </section>

              <section className="strategy-grid" aria-label="Approach Strategy">
                <article className="strategy-card"><span className="strategy-number">01</span><span className="strategy-icon"><Target size={18} /></span><small>提案切り口</small><p>{selectedAnalysis.approach.angle}</p></article>
                <article className="strategy-card"><span className="strategy-number">02</span><span className="strategy-icon"><Sparkles size={18} /></span><small>最初に伝える価値</small><p>{selectedAnalysis.approach.firstValue}</p></article>
                <article className="strategy-card strategy-hypothesis"><span className="strategy-number">03</span><span className="strategy-icon"><Lightbulb size={18} /></span><small>想定課題 · 課題仮説</small><p>{selectedAnalysis.approach.assumedChallenge}</p></article>
                <article className="strategy-card"><span className="strategy-number">04</span><span className="strategy-icon"><ArrowRight size={18} /></span><small>CTA</small><p>{selectedAnalysis.approach.cta}</p></article>
              </section>

              <div className="draft-layout">
                <section className="panel-card draft-card" aria-labelledby="draft-title">
                  <div className="panel-heading"><div className="heading-with-icon"><span className="section-icon section-icon-violet"><FileText size={19} /></span><div><p className="section-kicker">SALES DM DRAFT</p><h2 id="draft-title">営業DM Draft</h2></div></div><span className="draft-badge">DRAFT · 編集可能</span></div>
                  <label className="field"><span className="field-label">件名</span><input value={(draftEdits[selectedAnalysis.candidate.id]?.subject ?? selectedAnalysis.draft.subject)} onChange={(event) => updateDraft(selectedAnalysis.candidate.id, "subject", event.target.value)} /></label>
                  <label className="field draft-body-field"><span className="field-label">本文</span><textarea rows={15} value={(draftEdits[selectedAnalysis.candidate.id]?.body ?? selectedAnalysis.draft.body)} onChange={(event) => updateDraft(selectedAnalysis.candidate.id, "body", event.target.value)} /></label>
                  <div className="citation-panel"><div className="citation-heading"><Link size={15} /><strong>Citations</strong><span>本文内の主張とSourceを接続</span></div>{selectedAnalysis.draft.citations.length > 0 ? <ol>{selectedAnalysis.draft.citations.map((citation) => <li key={citation.evidenceId}><span>[{citation.number}]</span><a href={citation.url} target="_blank" rel="noreferrer">{citation.title}<ExternalLink size={12} /></a></li>)}</ol> : <p>具体的な主張に使えるSourceがないため、状況確認から始めるDraftです。</p>}</div>
                </section>

                <aside className="review-column" aria-labelledby="human-review-title">
                  <section className="review-card">
                    <span className="review-icon"><FileCheck2 size={22} /></span>
                    <p className="section-kicker">HUMAN-IN-THE-LOOP</p>
                    <h2 id="human-review-title">Human Review</h2>
                    <p>内容と根拠を人が確認するまで、Copyはロックされています。</p>
                    <div className="review-checklist">
                      <span><Check size={14} /> 課題を断定していない</span>
                      <span><Check size={14} /> SourceとCitationが対応</span>
                      <span><Check size={14} /> CTAが適切</span>
                    </div>
                    <label className="review-confirmation">
                      <input type="checkbox" checked={reviewedCandidates[selectedAnalysis.candidate.id] ?? false} onChange={(event) => { setReviewedCandidates((current) => ({ ...current, [selectedAnalysis.candidate.id]: event.target.checked })); setCopiedCandidateId(null); }} />
                      <span className="custom-checkbox"><Check size={14} /></span>
                      <span><strong>根拠と表現を確認しました</strong><small>Copy後の利用・送付判断は私が行います</small></span>
                    </label>
                    <button className="button button-primary button-full copy-button" type="button" disabled={!(reviewedCandidates[selectedAnalysis.candidate.id] ?? false)} onClick={() => copyDraft(selectedAnalysis)}>
                      {copiedCandidateId === selectedAnalysis.candidate.id ? <><CheckCircle2 size={17} /> コピーしました</> : <><Copy size={17} /> Draftをコピー</>}
                    </button>
                    <p className="copy-only-note"><ShieldCheck size={14} /> Copyのみ。自動送信・CRM登録は行いません。</p>
                  </section>
                  <section className="panel-card compact-evidence-card">
                    <p className="section-kicker">EVIDENCE USED</p>
                    <h3>このDraftの根拠</h3>
                    {selectedAnalysis.approach.evidenceIds.length > 0 ? selectedAnalysis.approach.evidenceIds.map((evidenceId) => { const evidence = selectedAnalysis.candidate.evidence.find((item) => item.id === evidenceId); return evidence ? <a key={evidenceId} href={evidence.url} target="_blank" rel="noreferrer"><span><Globe2 size={14} /></span><div><strong>{evidence.title}</strong><small>{SOURCE_LABEL[evidence.sourceType]}</small></div><ExternalLink size={13} /></a> : null; }) : <p className="no-evidence-note"><Info size={14} /> 初回接点では具体的な課題を断定せず、現状確認から始めます。</p>}
                  </section>
                </aside>
              </div>
            </div>
          )}
        </main>

        <aside className="activity-panel" aria-labelledby="activity-title">
          <div className="activity-header">
            <div><span className="activity-icon"><Activity size={16} /></span><div><span>AGENT TRACE</span><strong id="activity-title">Activity Log</strong></div></div>
          <span className="live-indicator"><i /> TRACE</span>
          </div>
          {result !== null && (
            <div className="usage-panel" aria-label="Guardrail使用状況">
              <div className="usage-title"><span>Guardrail usage</span><ShieldCheck size={14} /></div>
              <div className="usage-grid">
                <div><span>候補</span><strong>{result.usage.candidates}<small>/{result.guardrails.maxCandidates}</small></strong><i><b style={{ width: `${result.guardrails.maxCandidates === 0 ? 0 : (result.usage.candidates / result.guardrails.maxCandidates) * 100}%` }} /></i></div>
                <div><span>Search</span><strong>{result.usage.searches}<small>/{result.guardrails.maxSearches}</small></strong><i><b style={{ width: `${result.guardrails.maxSearches === 0 ? 0 : (result.usage.searches / result.guardrails.maxSearches) * 100}%` }} /></i></div>
                <div><span>Tools</span><strong>{result.usage.toolCalls}<small>/{result.guardrails.maxToolCalls}</small></strong><i><b style={{ width: `${result.guardrails.maxToolCalls === 0 ? 0 : (result.usage.toolCalls / result.guardrails.maxToolCalls) * 100}%` }} /></i></div>
                <div><span>Retry</span><strong>{result.usage.retries}<small>/{result.guardrails.maxRetries}</small></strong><i><b style={{ width: `${result.guardrails.maxRetries === 0 ? 0 : (result.usage.retries / result.guardrails.maxRetries) * 100}%` }} /></i></div>
              </div>
            </div>
          )}
          <ol className="activity-list">
            {activityLog.map((entry) => (
              <li className={`activity-entry outcome-${entry.outcome}`} key={`${entry.sequence}-${entry.action}`}>
                <div className="activity-timeline"><span>{String(entry.sequence).padStart(2, "0")}</span><i /></div>
                <div className="activity-content"><div className="activity-meta"><span>{entry.phase}</span><small>{OUTCOME_LABEL[entry.outcome]}</small></div><strong>{entry.action}</strong><p>{entry.detail}</p>{entry.candidateId && <button type="button" disabled={!result?.analyses.some((analysis) => analysis.candidate.id === entry.candidateId)} onClick={() => openCandidate(entry.candidateId!)}>候補を開く <ChevronRight size={12} /></button>}</div>
              </li>
            ))}
          </ol>
          <div className="activity-footer"><span><ShieldCheck size={14} /> Web Content = Data</span><span><Ban size={14} /> External actions = 0</span></div>
        </aside>
      </div>
    </div>
  );
}
