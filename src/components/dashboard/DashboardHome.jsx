import { useCallback, useEffect, useMemo, useState } from "react";
import { AI_PROSPECTS_CHANGED_EVENT, listAiProspects } from "../../lib/aiProspects";
import {
  fetchAllTeamTrainingSessions,
  isAiRoleplayTrainingSession,
  TRAINING_SESSIONS_CHANGED_EVENT,
} from "../../lib/trainingSessions";
import { isSupabaseConfigured } from "../../lib/supabaseClient";
import DashboardOverview from "./DashboardOverview";
import RepPerformanceTable from "./RepPerformanceTable";

import CustomizeDashboard, { loadWidgetConfig } from "./CustomizeDashboard";
import { useDateRange, inRange, formatDateShort } from "../../lib/DateRangeContext";
import { computeOverviewStatValues, maxSessionCreatedAt } from "../../lib/overviewStats";
import DashboardPageHero from "./DashboardPageHero";

// ── Info icon with tooltip ────────────────────────────────────────────────────
function InfoTooltip({ text }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="db-stat-info-wrap">
      <button
        type="button"
        className="db-stat-info-btn"
        aria-label="Widget info"
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        onBlur={() => setOpen(false)}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="16" x2="12" y2="12"/>
          <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
      </button>
      {open && (
        <span className="db-stat-tooltip" role="tooltip">{text}</span>
      )}
    </span>
  );
}

// ── Inline stat card ────────────────────────────────────────────────────────────
function StatCard({ label, value, delta, info, showDelta = true }) {
  return (
    <article className="db-stat-card">
      <p className="db-stat-label">
        {label}
        {info && <InfoTooltip text={info} />}
      </p>
      <p className="db-stat-value">{value}</p>
      {showDelta ? <p className="db-stat-delta">{delta} vs last week</p> : null}
    </article>
  );
}

// ── Sales Pulse panel (placeholder) ────────────────────────────────────────────
function SalesPulsePanel() {
  return (
    <section className="db-panel db-pulse-panel db-widget-full">
      <h3>Sales Pulse</h3>
      <p className="db-panel-sub">Win/loss analysis and deal outcomes from your team&apos;s calls</p>
      <div className="db-pulse-empty">No call data yet</div>
    </section>
  );
}

// ── Flagged Reps panel (placeholder) ───────────────────────────────────────────
function FlaggedRepsPanel() {
  return (
    <section className="db-panel db-widget-full">
      <div className="db-rep-header">
        <h3>Flagged Reps</h3>
        <p>Team members with call scores 15+ points below team average.</p>
      </div>
      <div className="db-pulse-empty">No flagged reps — great work!</div>
    </section>
  );
}

// ── Main component ──────────────────────────────────────────────────────────────
export default function DashboardHome({ user, profile }) {
  const [sessions, setSessions] = useState([]);
  const [aiProspectRows, setAiProspectRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [widgetConfig, setWidgetConfig] = useState(() => loadWidgetConfig());
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const { start: rangeStart, end: rangeEnd, label: rangeLabel } = useDateRange();

  // Reload widget config when the modal applies changes
  useEffect(() => {
    function onWidgetsChanged(e) {
      setWidgetConfig(Array.isArray(e.detail) ? e.detail : loadWidgetConfig());
    }
    window.addEventListener("dashboard-widgets-changed", onWidgetsChanged);
    return () => window.removeEventListener("dashboard-widgets-changed", onWidgetsChanged);
  }, []);

  const refreshTrainingSessions = useCallback(async () => {
    if (!user?.id) {
      setSessions([]);
      return;
    }
    try {
      const rows = await fetchAllTeamTrainingSessions();
      setSessions(rows);
      setError("");
    } catch (sessionError) {
      setError(sessionError.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    refreshTrainingSessions();
  }, [refreshTrainingSessions]);

  useEffect(() => {
    function onTrainingSessionsChanged() {
      refreshTrainingSessions();
    }
    window.addEventListener(TRAINING_SESSIONS_CHANGED_EVENT, onTrainingSessionsChanged);
    return () =>
      window.removeEventListener(TRAINING_SESSIONS_CHANGED_EVENT, onTrainingSessionsChanged);
  }, [refreshTrainingSessions]);

  useEffect(() => {
    const id = window.setInterval(() => {
      refreshTrainingSessions();
    }, 60_000);
    return () => window.clearInterval(id);
  }, [refreshTrainingSessions]);

  const refreshAiProspects = useCallback(async () => {
    if (!user?.id || !isSupabaseConfigured) {
      setAiProspectRows([]);
      return;
    }
    try {
      const rows = await listAiProspects(user.id);
      setAiProspectRows(rows);
    } catch {
      setAiProspectRows([]);
    }
  }, [user?.id]);

  useEffect(() => {
    refreshAiProspects();
  }, [refreshAiProspects]);

  useEffect(() => {
    function onProspectsChanged() {
      refreshAiProspects();
    }
    window.addEventListener(AI_PROSPECTS_CHANGED_EVENT, onProspectsChanged);
    return () => window.removeEventListener(AI_PROSPECTS_CHANGED_EVENT, onProspectsChanged);
  }, [refreshAiProspects]);

  // Filter sessions to the selected date range
  const filteredSessions = useMemo(
    () => sessions.filter((s) => inRange(s.created_at, rangeStart, rangeEnd)),
    [sessions, rangeStart, rangeEnd]
  );

  const aiProspectsInRangeCount = useMemo(
    () => aiProspectRows.filter((p) => inRange(p.created_at, rangeStart, rangeEnd)).length,
    [aiProspectRows, rangeStart, rangeEnd]
  );

  const roleplaySessionsInRangeCount = useMemo(
    () => filteredSessions.filter((s) => isAiRoleplayTrainingSession(s)).length,
    [filteredSessions]
  );

  const lastCallInRangeLabel = useMemo(() => {
    const ts = maxSessionCreatedAt(filteredSessions);
    if (!ts) return "—";
    return formatDateShort(new Date(ts));
  }, [filteredSessions]);

  const stats = useMemo(() => {
    const v = computeOverviewStatValues(filteredSessions, { aiProspectCount: aiProspectsInRangeCount });
    return {
      "total-calls":       { label: "Total Calls",       value: v.totalCalls,              delta: "+0%", info: "Total number of recorded calls across all team members." },
      "last-call": {
        label: "Last Call",
        value: lastCallInRangeLabel,
        delta: "+0%",
        info: "Date of the most recent training session in the selected period (team-wide).",
        showDelta: false,
      },
      "training-time":     { label: "Training Time",     value: v.trainingTimeDisplay,   delta: "+0%", info: "Total time spent in AI roleplay sessions and training activities." },
      "ai-roleplays":      { label: "AI Roleplays",      value: v.aiRoleplays,           delta: "+0%", info: "Number of AI prospects created in the AI Roleplay section (in the selected date range)." },
      "roleplay-sessions": {
        label: "AI Roleplay Sessions",
        value: roleplaySessionsInRangeCount,
        delta: "+0%",
        info: "Completed AI roleplay calls in the selected date range (one row per session, stored with your training data).",
      },
      "avg-call-score":    { label: "Avg Call Score",    value: v.avgCallScore,          delta: "+0%", info: "Team-wide average AI call score based on discovery, objection handling, and closing." },
      "avg-call-duration": { label: "Avg Call Duration", value: `${v.avgDurationMins}m`, delta: "+0%", info: "Average duration of all recorded calls across your team members." },
    };
  }, [filteredSessions, aiProspectsInRangeCount, roleplaySessionsInRangeCount, lastCallInRangeLabel]);

  // Render each widget by its ID
  function renderWidget(id) {
    switch (id) {
      case "total-calls":
      case "last-call":
      case "training-time":
      case "ai-roleplays":
      case "roleplay-sessions":
      case "avg-call-score":
      case "avg-call-duration": {
        const s = stats[id];
        if (!s) return null;
        return (
          <StatCard
            key={id}
            label={s.label}
            value={s.value}
            delta={s.delta}
            info={s.info}
            showDelta={s.showDelta !== false}
          />
        );
      }
      case "sales-pulse":
        return <SalesPulsePanel key={id} />;
      case "flagged-reps":
        return <FlaggedRepsPanel key={id} />;
      case "performance-overview":
        return <DashboardOverview key={id} />;
      case "rep-performance-table":
        return (
          <div key={id} className="db-widget-full">
            <RepPerformanceTable sessions={filteredSessions} loading={loading} />
          </div>
        );
      default:
        return null;
    }
  }

  // Stat-card IDs (render inline in a grid row)
  const STAT_IDS = new Set([
    "total-calls",
    "last-call",
    "training-time",
    "ai-roleplays",
    "roleplay-sessions",
    "avg-call-score",
    "avg-call-duration",
  ]);

  // Separate stat cards from panel/chart/table widgets.
  // Stat cards always render as ONE single row (regardless of their position in the
  // active list) so they stay together and keep a consistent size.
  const activeStatIds  = widgetConfig.filter((id) => STAT_IDS.has(id));
  const activeOtherIds = widgetConfig.filter((id) => !STAT_IDS.has(id));

  const renderItems = [];

  // Stats row — always first, uses auto-fill so each card keeps the same
  // width whether 1 or 4 are active (empty columns fill the rest of the row).
  if (activeStatIds.length > 0) {
    renderItems.push(
      <div key="stats-group" className="db-stats-grid">
        {activeStatIds.map((id) => renderWidget(id))}
      </div>
    );
  }

  // Other widgets in the order the user set in the customize panel
  for (const id of activeOtherIds) {
    renderItems.push(renderWidget(id));
  }

  const firstName = profile?.full_name?.split(" ")[0] || user.email?.split("@")[0] || "there";

  return (
    <>
      <DashboardPageHero
        eyebrow="Overview"
        title="Team Overview"
        subtitle={
          <>
            Good {getGreeting()} {firstName} — widgets below reflect <strong>{rangeLabel}</strong>.
          </>
        }
        helpLink={{
          href: "#",
          label: "Dashboard tips · View docs",
          onClick: (e) => e.preventDefault(),
        }}
        primaryButton={{
          label: "Customize",
          onClick: () => setCustomizeOpen(true),
        }}
        variant="overview"
      />

      {/* All widgets in one stream — gap is controlled by CSS, not individual margins */}
      <div className="db-widget-stream">
        {renderItems}

        {error ? <p className="dashboard-inline-error">{error}</p> : null}
      </div>

      {customizeOpen && (
        <CustomizeDashboard onClose={() => setCustomizeOpen(false)} />
      )}
    </>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
