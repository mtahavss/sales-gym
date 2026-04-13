import { useMemo, useState } from "react";
import { useDateRange } from "../../lib/DateRangeContext";
import DashboardPageHero from "./DashboardPageHero";
import "./DashboardMetrics.css";
import ThemedMenuSelect from "./ThemedMenuSelect";

const METRICS_PERF_OPTIONS = [
  { value: "cash", label: "Cash Collected" },
  { value: "score", label: "AI Score" },
  { value: "close", label: "Close Rate" },
];

const METRICS_TREND_OPTIONS = [
  { value: "", label: "Select metric" },
  { value: "score", label: "AI score" },
  { value: "revenue", label: "Revenue" },
];

function InfoIcon() {
  return (
    <svg className="db-metrics-info" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path fill="currentColor" d="M7.25 6.75h1.5V5h-1.5v1.75zm0 4.5h1.5V7.5h-1.5v3.75z" />
    </svg>
  );
}

/** Flat line chart: yAxis labels top→bottom = high→low; data is flat at min value. */
function MetricsLineChart({ yLabels, dates, lineColor = "#c2410c", valuePrefix = "", showLegend = true }) {
  const w = 520;
  const h = 200;
  const padL = 44;
  const padR = 12;
  const padT = 14;
  const padB = 32;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;
  const n = dates.length;
  const yCount = yLabels.length;

  const points = dates.map((_, i) => {
    const x = padL + (n === 1 ? innerW / 2 : (innerW * i) / (n - 1));
    const y = padT + innerH;
    return `${x},${y}`;
  });

  const gridLines = yLabels.map((_, i) => {
    const y = padT + (innerH * i) / (yCount - 1 || 1);
    return (
      <line key={i} x1={padL} x2={w - padR} y1={y} y2={y} className="db-metrics-chart-grid" />
    );
  });

  return (
    <div className="db-metrics-chart-wrap">
      <svg className="db-metrics-chart-svg" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet">
        {gridLines}
        <polyline
          className="db-metrics-chart-line"
          fill="none"
          stroke={lineColor}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points.join(" ")}
        />
        {dates.map((d, i) => {
          const x = padL + (n === 1 ? innerW / 2 : (innerW * i) / (n - 1));
          return (
            <text key={d} x={x} y={h - 8} textAnchor="middle" className="db-metrics-chart-axis-x">
              {d}
            </text>
          );
        })}
        {yLabels.map((label, i) => {
          const y = padT + (innerH * i) / (yCount - 1 || 1);
          const text = typeof label === "number" ? `${valuePrefix}${label}` : label;
          return (
            <text key={i} x={padL - 8} y={y + 4} textAnchor="end" className="db-metrics-chart-axis-y">
              {text}
            </text>
          );
        })}
      </svg>
      {showLegend ? (
        <div className="db-metrics-chart-legend">
          <span className="db-metrics-legend-dot" style={{ background: lineColor }} />
          <span>muhammad</span>
        </div>
      ) : null}
    </div>
  );
}

export default function DashboardMetrics({ user, profile }) {
  const [leaderboardQuery, setLeaderboardQuery] = useState("");
  const [perfMetric, setPerfMetric] = useState("cash");
  const [trendMetric, setTrendMetric] = useState("");
  const { label: rangeLabel } = useDateRange();
  const displayName =
    (profile?.full_name || profile?.name || user?.email?.split("@")[0] || "muhammad").toLowerCase();
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 1)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("") || "M";

  const dates = useMemo(() => ["Mar 12", "Mar 13", "Mar 14", "Mar 15", "Mar 16", "Mar 17", "Mar 18", "Mar 19"], []);

  const repYLabels = [7, 6, 5, 4, 3, 2, 1, 0].map((v) => `$${v}`);
  const teamYLabels = [4, 3, 2, 1, 0];

  const rowVisible = displayName.includes(leaderboardQuery.toLowerCase().trim()) || leaderboardQuery.trim() === "";

  return (
    <div className="db-metrics-page">
      <DashboardPageHero
        eyebrow="Analytics"
        title="Metrics"
        subtitle={
          <>
            Sales performance and coaching insights for your team. Showing: <strong>{rangeLabel}</strong>
          </>
        }
        helpLink={{
          href: "#",
          label: "Understanding metrics · View docs",
          onClick: (e) => e.preventDefault(),
        }}
        primaryButton={{
          label: "Refresh metrics",
          onClick: () => {
            window.dispatchEvent(new CustomEvent("dashboard-metrics-refresh"));
          },
        }}
        variant="metrics"
      />

      <section className="db-metrics-kpi-row">
        <article className="db-metrics-kpi">
          <p className="db-metrics-kpi-label">Avg AI Score</p>
          <p className="db-metrics-kpi-value">0</p>
          <p className="db-metrics-kpi-hint">0 roleplays</p>
        </article>
        <article className="db-metrics-kpi">
          <p className="db-metrics-kpi-label">Cash Collected</p>
          <p className="db-metrics-kpi-value">$0</p>
          <p className="db-metrics-kpi-hint">Total revenue</p>
        </article>
        <article className="db-metrics-kpi">
          <p className="db-metrics-kpi-label">Close Rate</p>
          <p className="db-metrics-kpi-value">0%</p>
          <p className="db-metrics-kpi-hint">0 calls</p>
        </article>
      </section>

      <section className="db-metrics-panel">
        <div className="db-metrics-panel-head">
          <div>
            <h2 className="db-metrics-panel-title">
              Performance per Rep
              <InfoIcon />
            </h2>
            <p className="db-metrics-panel-desc">Individual trends for all team members.</p>
          </div>
          <ThemedMenuSelect
            className="db-metrics-menu-select"
            value={perfMetric}
            onChange={setPerfMetric}
            options={METRICS_PERF_OPTIONS}
            ariaLabel="Performance metric"
          />
        </div>
        <MetricsLineChart yLabels={repYLabels} dates={dates} valuePrefix="" />
      </section>

      <section className="db-metrics-panel">
        <div className="db-metrics-panel-head">
          <div>
            <h2 className="db-metrics-panel-title">Leaderboard</h2>
            <p className="db-metrics-panel-desc">Team performance ranked by AI roleplay score.</p>
          </div>
          <input
            type="search"
            className="db-metrics-search"
            placeholder="Search team members..."
            value={leaderboardQuery}
            onChange={(e) => setLeaderboardQuery(e.target.value)}
            aria-label="Search team members"
          />
        </div>
        <div className="db-table-wrap db-metrics-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Representative</th>
                <th>Calls</th>
                <th>AI score</th>
                <th>Revenue</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rowVisible ? (
                <tr>
                  <td>
                    <span className="db-rank-pill">1</span>
                  </td>
                  <td>
                    <div className="db-rep-cell">
                      <span className="db-rep-avatar db-metrics-lb-avatar">{initials}</span>
                      <span>{displayName}</span>
                    </div>
                  </td>
                  <td>0</td>
                  <td>0%</td>
                  <td>$0</td>
                  <td>
                    <button type="button" className="db-metrics-view-link">
                      View &gt;
                    </button>
                  </td>
                </tr>
              ) : (
                <tr>
                  <td colSpan={6} className="db-metrics-table-empty">
                    No team members match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="db-metrics-panel">
        <div className="db-metrics-panel-head">
          <div>
            <h2 className="db-metrics-panel-title">Team Average Trend</h2>
            <p className="db-metrics-panel-desc">Cumulative performance metrics over time.</p>
          </div>
          <ThemedMenuSelect
            className="db-metrics-menu-select"
            value={trendMetric}
            onChange={setTrendMetric}
            options={METRICS_TREND_OPTIONS}
            ariaLabel="Trend metric"
          />
        </div>
        <MetricsLineChart yLabels={teamYLabels} dates={dates} valuePrefix="" lineColor="#c2410c" showLegend={false} />
      </section>


      <div className="db-metrics-bottom-grid">
        <section className="db-metrics-panel db-metrics-insight">
          <h2 className="db-metrics-panel-title">
            Top Objections
            <InfoIcon />
          </h2>
          <p className="db-metrics-panel-desc">Most common objections encountered.</p>
          <p className="db-metrics-insight-body">
            No objection data available yet. Objections are extracted from call transcripts during AI analysis.
          </p>
        </section>
        <section className="db-metrics-panel db-metrics-insight">
          <h2 className="db-metrics-panel-title">
            Key Strengths
            <InfoIcon />
          </h2>
          <p className="db-metrics-panel-desc">Most frequently demonstrated skills.</p>
          <p className="db-metrics-insight-body">No strength data available.</p>
        </section>
      </div>
    </div>
  );
}
