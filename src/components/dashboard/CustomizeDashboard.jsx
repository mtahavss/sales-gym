import { useState, useRef } from "react";

// ── Widget registry ────────────────────────────────────────────────────────────

export const ALL_WIDGETS = [
  {
    id: "avg-call-score",
    label: "Average Call Score",
    desc: "Team-wide average AI call score based on discovery, objection handling, and closing",
    category: "METRICS",
    iconType: "trend",
  },
  {
    id: "avg-call-duration",
    label: "Avg Call Duration",
    desc: "Average duration of all recorded calls across your team members",
    category: "METRICS",
    iconType: "clock",
  },
  {
    id: "flagged-reps",
    label: "Flagged Reps",
    desc: "Team members with call scores 15+ points below team average",
    category: "METRICS",
    iconType: "alert",
  },
  {
    id: "total-calls",
    label: "Total Calls",
    desc: "Total number of recorded calls across all team members",
    category: "METRICS",
    iconType: "bar",
  },
  {
    id: "training-time",
    label: "Team Training Time",
    desc: "Total time spent in AI roleplay sessions and training activities",
    category: "METRICS",
    iconType: "clock",
  },
  {
    id: "ai-roleplays",
    label: "AI Roleplays",
    desc: "Total number of AI roleplay practice sessions across the team",
    category: "METRICS",
    iconType: "pulse",
  },
  {
    id: "roleplay-sessions",
    label: "AI Roleplay Sessions",
    desc: "Completed live AI roleplay sessions in the selected period",
    category: "METRICS",
    iconType: "activity",
  },
  {
    id: "sales-pulse",
    label: "Sales Pulse",
    desc: "Win/loss analysis and deal outcomes from your team's calls",
    category: "METRICS",
    iconType: "activity",
  },
  {
    id: "performance-overview",
    label: "Performance Overview",
    desc: "Call scores and training volume trends over time",
    category: "CHARTS",
    iconType: "target",
  },
  {
    id: "rep-performance-table",
    label: "Rep Performance Table",
    desc: "Detailed performance overview with call scores, red flags, and training progress",
    category: "TABLES",
    iconType: "people",
  },
];

export const DEFAULT_ACTIVE = [
  "total-calls",
  "training-time",
  "ai-roleplays",
  "roleplay-sessions",
  "avg-call-duration",
  "sales-pulse",
  "performance-overview",
  "rep-performance-table",
  "avg-call-score",
  "flagged-reps",
];

const STORAGE_KEY = "dashboard_widget_config";

export function loadWidgetConfig() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [...DEFAULT_ACTIVE];
}

function saveAndBroadcast(ids) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent("dashboard-widgets-changed", { detail: ids }));
}

// ── Minimal SVG icons ──────────────────────────────────────────────────────────

function WidgetIcon({ type, size = 16 }) {
  const props = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" };
  switch (type) {
    case "bar":
      return <svg {...props}><rect x="3" y="12" width="4" height="9" rx="1"/><rect x="10" y="7" width="4" height="14" rx="1"/><rect x="17" y="4" width="4" height="17" rx="1"/></svg>;
    case "clock":
      return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>;
    case "pulse":
      return <svg {...props}><path d="M2 12h4l3-7 4 14 3-7h6"/></svg>;
    case "activity":
      return <svg {...props}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
    case "trend":
      return <svg {...props}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;
    case "alert":
      return <svg {...props}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
    case "target":
      return <svg {...props}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
    case "people":
      return <svg {...props}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
    default:
      return <svg {...props}><rect x="3" y="3" width="18" height="18" rx="2"/></svg>;
  }
}

function DragIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
      <circle cx="4" cy="3" r="1.2"/><circle cx="10" cy="3" r="1.2"/>
      <circle cx="4" cy="7" r="1.2"/><circle cx="10" cy="7" r="1.2"/>
      <circle cx="4" cy="11" r="1.2"/><circle cx="10" cy="11" r="1.2"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function CustomizeDashboard({ onClose }) {
  const [activeIds, setActiveIds] = useState(() => loadWidgetConfig());
  const dragIdx = useRef(null);
  const dragOverIdx = useRef(null);
  const [dragOver, setDragOver] = useState(null);

  function toggleWidget(id) {
    setActiveIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleDragStart(e, idx) {
    dragIdx.current = idx;
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e, idx) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    dragOverIdx.current = idx;
    setDragOver(idx);
  }

  function handleDragLeave() {
    setDragOver(null);
  }

  function handleDrop(e, idx) {
    e.preventDefault();
    setDragOver(null);
    const from = dragIdx.current;
    if (from === null || from === idx) return;
    setActiveIds((prev) => {
      const arr = [...prev];
      const [moved] = arr.splice(from, 1);
      arr.splice(idx, 0, moved);
      return arr;
    });
    dragIdx.current = null;
    dragOverIdx.current = null;
  }

  function handleDragEnd() {
    dragIdx.current = null;
    dragOverIdx.current = null;
    setDragOver(null);
  }

  function handleApply() {
    saveAndBroadcast(activeIds);
    onClose();
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  const categories = ["METRICS", "CHARTS", "TABLES"];

  return (
    <div className="cdash-overlay" onMouseDown={handleOverlayClick}>
      <div className="cdash-modal" role="dialog" aria-modal="true" aria-label="Customize Dashboard">
        {/* Header */}
        <div className="cdash-header">
          <div className="cdash-header-text">
            <h2 className="cdash-title">Customize Dashboard</h2>
            <p className="cdash-subtitle">
              Add or remove sections and drag to reorder how they appear on your overview.
            </p>
          </div>
          <button type="button" className="cdash-close-btn" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body: left + right */}
        <div className="cdash-body">
          {/* ── Left: Available Sections ── */}
          <div className="cdash-left">
            <p className="cdash-panel-title">Available Sections</p>
            <p className="cdash-panel-sub">Click any section to show or hide it in your dashboard.</p>

            {categories.map((cat) => {
              const widgets = ALL_WIDGETS.filter((w) => w.category === cat);
              return (
                <div key={cat} className="cdash-cat-group">
                  <p className="cdash-cat-label">{cat}</p>
                  {widgets.map((w) => {
                    const isActive = activeIds.includes(w.id);
                    return (
                      <button
                        key={w.id}
                        type="button"
                        className={`cdash-widget-row${isActive ? " is-checked" : ""}`}
                        onClick={() => toggleWidget(w.id)}
                      >
                        <span className="cdash-widget-ico">
                          <WidgetIcon type={w.iconType} />
                        </span>
                        <span className="cdash-widget-info">
                          <span className="cdash-widget-name">{w.label}</span>
                          <span className="cdash-widget-desc">{w.desc}</span>
                        </span>
                        <span className={`cdash-check-box${isActive ? " is-checked" : ""}`}>
                          {isActive && <CheckIcon />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* ── Right: Active Sections ── */}
          <div className="cdash-right">
            <p className="cdash-panel-title">Active Sections ({activeIds.length})</p>
            <p className="cdash-panel-sub">Drag to reorder how sections appear on your overview.</p>

            <div className="cdash-active-list">
              {activeIds.length === 0 && (
                <div className="cdash-empty-msg">
                  No sections selected. Click items on the left to add them.
                </div>
              )}
              {activeIds.map((id, idx) => {
                const w = ALL_WIDGETS.find((x) => x.id === id);
                if (!w) return null;
                return (
                  <div
                    key={id}
                    className={`cdash-active-item${dragOver === idx ? " is-drag-over" : ""}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, idx)}
                    onDragEnd={handleDragEnd}
                  >
                    <span className="cdash-drag-handle"><DragIcon /></span>
                    <span className="cdash-widget-ico cdash-widget-ico-sm">
                      <WidgetIcon type={w.iconType} />
                    </span>
                    <span className="cdash-widget-info">
                      <span className="cdash-widget-name">{w.label}</span>
                      <span className="cdash-widget-desc">{w.desc}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="cdash-footer">
          <button type="button" className="cdash-cancel-btn" onClick={onClose}>Cancel</button>
          <button type="button" className="cdash-apply-btn" onClick={handleApply}>Apply</button>
        </div>
      </div>
    </div>
  );
}
