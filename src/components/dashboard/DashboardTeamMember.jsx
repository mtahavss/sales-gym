import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { hasPermission } from "../../lib/rbac";
import { useDateRange, inRange, formatDateShort } from "../../lib/DateRangeContext";
import {
  isAiRoleplayTrainingSession,
  listTrainingSessions,
  TRAINING_SESSIONS_CHANGED_EVENT,
} from "../../lib/trainingSessions";
import { computeOverviewStatValues } from "../../lib/overviewStats";
import ThemeSpinner from "../ThemeSpinner";
import ThemedMenuSelect from "./ThemedMenuSelect";

/* ── Icons ────────────────────────────────────────────────── */
function BackIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M13 16l-6-6 6-6" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.2">
      <circle cx="8" cy="8" r="6.5" />
      <path fill="currentColor" stroke="none" d="M7.25 6.75h1.5V5h-1.5v1.75zm0 4.5h1.5V7.5h-1.5v3.75z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <circle cx="8.5" cy="8.5" r="5.5" />
      <path d="M15 15l-2.5-2.5" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

/* ── Helpers ──────────────────────────────────────────────── */
function getInitials(name = "") {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() || "").join("");
}

const TREND_METRIC_OPTIONS = [
  { value: "live", label: "Live Call Score" },
  { value: "ai", label: "AI Roleplay Score" },
  { value: "revenue", label: "Revenue" },
];

const CALL_TYPE_FILTER_OPTIONS = [
  { value: "all", label: "All types" },
  { value: "live", label: "Live Calls" },
  { value: "ai", label: "AI Roleplay" },
];

/* ── Radar chart ──────────────────────────────────────────── */
const RADAR_AXES = ["Discovery", "Rapport Building", "Objection Handling", "Presentation", "Closing"];
const CX = 160, CY = 130, R = 95;

function radarPoint(angleIndex, fraction) {
  const angle = (Math.PI * 2 * angleIndex) / RADAR_AXES.length - Math.PI / 2;
  return {
    x: CX + R * fraction * Math.cos(angle),
    y: CY + R * fraction * Math.sin(angle)
  };
}

function RadarChart({ scores = [] }) {
  const gridLevels = [0.25, 0.5, 0.75, 1];
  const hasData = scores.some((s) => s > 0);

  const dataPoints = RADAR_AXES.map((_, i) => radarPoint(i, (scores[i] || 0) / 100));
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") + " Z";

  return (
    <div className="tm-radar-wrap">
      <svg viewBox="0 0 320 260" className="tm-radar-svg" aria-label="Performance profile radar">
        {/* grid polygons */}
        {gridLevels.map((lvl) => {
          const pts = RADAR_AXES.map((_, i) => {
            const p = radarPoint(i, lvl);
            return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
          }).join(" ");
          return <polygon key={lvl} points={pts} className="tm-radar-grid-poly" />;
        })}

        {/* axis lines */}
        {RADAR_AXES.map((_, i) => {
          const end = radarPoint(i, 1);
          return <line key={i} x1={CX} y1={CY} x2={end.x.toFixed(1)} y2={end.y.toFixed(1)} className="tm-radar-axis" />;
        })}

        {/* axis labels */}
        {RADAR_AXES.map((label, i) => {
          const p = radarPoint(i, 1.22);
          let anchor = "middle";
          if (p.x < CX - 10) anchor = "end";
          else if (p.x > CX + 10) anchor = "start";
          return (
            <text key={label} x={p.x.toFixed(1)} y={p.y.toFixed(1)} textAnchor={anchor} className="tm-radar-label">
              {label}
            </text>
          );
        })}

        {/* data polygon */}
        {hasData ? (
          <path d={dataPath} className="tm-radar-data-fill" />
        ) : null}
      </svg>

      {!hasData && (
        <p className="tm-radar-empty">No call data yet for this rep</p>
      )}
    </div>
  );
}

/* ── Trend line chart ─────────────────────────────────────── */
function TrendChart({ dates }) {
  const w = 520, h = 180, padL = 36, padR = 12, padT = 12, padB = 28;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;
  const n = dates.length;
  const yLabels = [4, 3, 2, 1, 0];

  const points = dates.map((_, i) => {
    const x = padL + (n === 1 ? innerW / 2 : (innerW * i) / (n - 1));
    const y = padT + innerH;
    return `${x},${y}`;
  });

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="tm-trend-svg" preserveAspectRatio="xMidYMid meet">
      {yLabels.map((v, i) => {
        const y = padT + (innerH * i) / (yLabels.length - 1);
        return (
          <g key={v}>
            <line x1={padL} x2={w - padR} y1={y} y2={y} stroke="#fcd9b8" strokeWidth="1" />
            <text x={padL - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#b98862">{v}</text>
          </g>
        );
      })}
      <polyline fill="none" stroke="#c2410c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points.join(" ")} />
      {dates.map((d, i) => {
        const x = padL + (n === 1 ? innerW / 2 : (innerW * i) / (n - 1));
        return <text key={d} x={x} y={h - 6} textAnchor="middle" fontSize="9.5" fill="#b98862">{d}</text>;
      })}
    </svg>
  );
}

/* ── Main component ───────────────────────────────────────── */
export default function DashboardTeamMember({ user, profile }) {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const { start: rangeStart, end: rangeEnd, label: rangeLabel } = useDateRange();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [callSearch, setCallSearch] = useState("");
  const [callType, setCallType] = useState("all");
  const [trendMetric, setTrendMetric] = useState("live");
  const [deleteBusy, setDeleteBusy] = useState(false);

  const dates = ["Mar 12", "Mar 13", "Mar 14", "Mar 15", "Mar 16", "Mar 17", "Mar 18"];

  const refreshSessions = useCallback(async () => {
    if (!supabase || !memberId) {
      setSessions([]);
      setSessionsLoading(false);
      return;
    }
    setSessionsLoading(true);
    try {
      const rows = await listTrainingSessions(memberId);
      setSessions(rows);
    } catch {
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    refreshSessions();
  }, [refreshSessions]);

  useEffect(() => {
    function onSessionsChanged() {
      refreshSessions();
    }
    window.addEventListener(TRAINING_SESSIONS_CHANGED_EVENT, onSessionsChanged);
    return () => window.removeEventListener(TRAINING_SESSIONS_CHANGED_EVENT, onSessionsChanged);
  }, [refreshSessions]);

  useEffect(() => {
    const id = window.setInterval(() => {
      refreshSessions();
    }, 60_000);
    return () => window.clearInterval(id);
  }, [refreshSessions]);

  const sessionsInRange = useMemo(
    () => sessions.filter((s) => inRange(s.created_at, rangeStart, rangeEnd)),
    [sessions, rangeStart, rangeEnd]
  );

  const periodStats = useMemo(
    () => computeOverviewStatValues(sessionsInRange, { aiProspectCount: 0 }),
    [sessionsInRange]
  );

  const lastCallEverAt = sessions[0]?.created_at ?? null;

  const displayedCalls = useMemo(() => {
    let rows = sessionsInRange;
    if (callType === "ai") {
      rows = rows.filter((s) => isAiRoleplayTrainingSession(s));
    } else if (callType === "live") {
      rows = rows.filter((s) => !isAiRoleplayTrainingSession(s));
    }
    const q = callSearch.trim().toLowerCase();
    if (q) {
      rows = rows.filter((s) => {
        const name = (s.closer_name || "").toLowerCase();
        const g = (s.goal || "").toLowerCase();
        const scen = (s.scenario || "").toLowerCase();
        return name.includes(q) || g.includes(q) || scen.includes(q);
      });
    }
    return rows;
  }, [sessionsInRange, callType, callSearch]);

  useEffect(() => {
    async function load() {
      // Always try profile prop first as a fast fallback
      const profileFallback =
        profile?.id === memberId ? profile :
        user?.id === memberId ? { id: user.id, email: user.email, full_name: user.user_metadata?.full_name || user.email?.split("@")[0], role: profile?.role || "viewer", created_at: null } :
        null;

      if (!supabase) {
        setMember(profileFallback);
        setLoading(false);
        return;
      }
      try {
        const { data } = await supabase
          .from("profiles")
          .select("id, email, full_name, role, created_at, active")
          .eq("id", memberId)
          .maybeSingle();
        const row = data || profileFallback;
        const isInactive = row && Number(row.active ?? 1) === 0;
        setMember(isInactive ? null : row);
      } catch {
        setMember(profileFallback);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [memberId]);

  if (loading) {
    return (
      <div className="tm-member-loading tm-member-loading--spinner">
        <ThemeSpinner size="md" label="Loading member" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="tm-member-loading">
        Member not found.{" "}
        <button type="button" className="tm-back-link" onClick={() => navigate("/dashboard/team")}>
          Back to Team
        </button>
      </div>
    );
  }

  const displayName = member.full_name || member.email?.split("@")[0] || "Team Member";
  const initials = getInitials(displayName);
  const roleLower = String(member.role || "").toLowerCase();
  const roleLabel =
    roleLower === "admin" || roleLower === "owner"
      ? "Owner"
      : roleLower === "editor"
        ? "Editor"
        : "Member";
  const isAdminViewer = hasPermission(profile?.role, "access_admin") && supabase;
  const isViewingSelf = member.id === user?.id;
  const canRemoveMember = isAdminViewer && !isViewingSelf;

  async function handleRemoveMember() {
    if (!canRemoveMember || deleteBusy) return;
    const ok = window.confirm(
      `Remove ${displayName} from the team? They will be hidden from the team list (active = 0).`
    );
    if (!ok) return;
    setDeleteBusy(true);
    try {
      const { error } = await supabase.from("profiles").update({ active: 0 }).eq("id", member.id);
      if (error) {
        throw new Error(error.message);
      }
      navigate("/dashboard/team");
    } catch (e) {
      window.alert(e?.message || "Could not remove this member. Check permissions in Supabase (RLS).");
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className="tm-member-page">
      {/* ── Page header ── */}
      <header className="tm-member-header">
        <div className="tm-member-header-left">
          <button type="button" className="tm-back-btn" onClick={() => navigate("/dashboard/team")} aria-label="Back to team">
            <BackIcon />
          </button>
          <span className="tm-member-avatar-lg">{initials || "U"}</span>
          <div>
            <h1 className="tm-member-title">{displayName}</h1>
            <p className="tm-member-sub">
              {member.email} · {roleLabel}
              {lastCallEverAt ? (
                <>
                  {" "}
                  · Last call{" "}
                  <time dateTime={lastCallEverAt} title={new Date(lastCallEverAt).toLocaleString()}>
                    {formatDateShort(new Date(lastCallEverAt))}
                  </time>
                </>
              ) : null}
            </p>
          </div>
        </div>
        {isAdminViewer ? (
          <div className="tm-member-header-right">
            {isViewingSelf ? (
              <button
                type="button"
                className="tm-member-delete-btn tm-member-delete-btn--self"
                disabled
                title="You can’t remove your own account here. Go to Team, open another member, then use Remove."
              >
                <TrashIcon />
                Remove
              </button>
            ) : (
              <button
                type="button"
                className="tm-member-delete-btn"
                onClick={handleRemoveMember}
                disabled={deleteBusy}
                title="Remove this member from the team"
              >
                <TrashIcon />
                {deleteBusy ? "Removing…" : "Remove"}
              </button>
            )}
          </div>
        ) : null}
      </header>

      {/* ── KPI row ── */}
      <div className="tm-kpi-row">
        <div className="tm-kpi-card">
          <p className="tm-kpi-label">Gross Value Sold</p>
          <p className="tm-kpi-value">$0</p>
          <div className="tm-kpi-bar" />
          <p className="tm-kpi-hint">Revenue generated</p>
        </div>
        <div className="tm-kpi-card">
          <p className="tm-kpi-label">Total Calls</p>
          <p className="tm-kpi-value">{periodStats.totalCalls}</p>
          <div className="tm-kpi-bar" />
          <p className="tm-kpi-hint">Calls in selected period ({rangeLabel})</p>
        </div>
        <div className="tm-kpi-card">
          <p className="tm-kpi-label">Avg Call Score</p>
          <p className="tm-kpi-value">{periodStats.avgCallScore}</p>
          <div className="tm-kpi-bar" />
          <p className="tm-kpi-hint">
            Across {periodStats.totalCalls} call{periodStats.totalCalls === 1 ? "" : "s"} in period
          </p>
        </div>
        <div className="tm-kpi-card">
          <p className="tm-kpi-label">Close Rate</p>
          <p className="tm-kpi-value">0%</p>
          <div className="tm-kpi-bar" />
          <p className="tm-kpi-hint">Win rate on processed calls</p>
        </div>
      </div>

      {/* ── Charts row ── */}
      <div className="tm-charts-row">
        {/* Radar */}
        <div className="db-panel tm-chart-panel">
          <div className="tm-chart-head">
            <h2 className="tm-chart-title">Performance Profile</h2>
            <p className="tm-chart-desc">Metrics over time for this rep.</p>
          </div>
          <RadarChart scores={[]} />
        </div>

        {/* Trend line */}
        <div className="db-panel tm-chart-panel">
          <div className="tm-chart-head">
            <h2 className="tm-chart-title">Performance Trend</h2>
            <label className="tm-chart-desc tm-chart-trend-label" htmlFor="tm-trend-metric">
              Metrics over time for:
            </label>
            <ThemedMenuSelect
              className="tm-trend-menu-select"
              buttonId="tm-trend-metric"
              value={trendMetric}
              onChange={setTrendMetric}
              options={TREND_METRIC_OPTIONS}
            />
          </div>
          <TrendChart dates={dates} />
        </div>
      </div>

      {/* ── Insights row ── */}
      <div className="tm-insights-row">
        <div className="db-panel tm-insight-panel">
          <h2 className="tm-chart-title">
            Top Objections <InfoIcon />
          </h2>
          <p className="tm-chart-desc">Most common objections encountered · click to view calls</p>
          <p className="tm-insight-empty">
            No objection data available yet.<br />
            Objections are extracted during call analysis.
          </p>
        </div>
        <div className="db-panel tm-insight-panel">
          <h2 className="tm-chart-title">
            Key Strengths <InfoIcon />
          </h2>
          <p className="tm-chart-desc">Most frequently demonstrated skills · click to view calls</p>
          <p className="tm-insight-empty">No strength data available.</p>
        </div>
      </div>

      {/* ── All Calls table ── */}
      <div className="db-panel tm-calls-panel">
        <div className="tm-calls-head">
          <div>
            <h2 className="tm-chart-title">All Calls</h2>
            <p className="tm-chart-desc">Training sessions in {rangeLabel}</p>
          </div>
          <div className="tm-calls-controls">
            <div className="tm-search-wrap tm-calls-search">
              <SearchIcon />
              <input
                className="tm-search-input"
                type="text"
                placeholder="Search calls..."
                value={callSearch}
                onChange={(e) => setCallSearch(e.target.value)}
              />
            </div>
            <ThemedMenuSelect
              className="tm-calls-type-select"
              buttonId="tm-call-type"
              value={callType}
              onChange={setCallType}
              options={CALL_TYPE_FILTER_OPTIONS}
              ariaLabel="Filter calls by type"
            />
          </div>
        </div>

        <div className="tm-table-wrap">
          <table className="tm-table tm-calls-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Call</th>
                <th>Type</th>
                <th>Score</th>
                <th>Revenue</th>
                <th>Logged</th>
              </tr>
            </thead>
            <tbody>
              {sessionsLoading ? (
                <tr>
                  <td colSpan={6} className="tm-empty-cell db-loading-cell">
                    <ThemeSpinner size="md" label="Loading calls" />
                  </td>
                </tr>
              ) : displayedCalls.length === 0 ? (
                <tr>
                  <td colSpan={6} className="tm-empty-cell">
                    No calls found for the selected filters.
                  </td>
                </tr>
              ) : (
                displayedCalls.map((row, i) => {
                  const ai = isAiRoleplayTrainingSession(row);
                  const when = row.created_at ? new Date(row.created_at).toLocaleString() : "—";
                  return (
                    <tr key={row.id}>
                      <td>{i + 1}</td>
                      <td>{row.closer_name || "Training call"}</td>
                      <td>{ai ? "AI Roleplay" : "Live"}</td>
                      <td className="tm-muted">—</td>
                      <td className="tm-muted">—</td>
                      <td>
                        <span className="tm-muted" title={when}>
                          {when}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
