import { useState } from "react";
import "./DashboardCallLibrary.css";
import ThemedMenuSelect from "./ThemedMenuSelect";

const REP_FILTER_OPTIONS = [{ value: "all", label: "All reps" }];

const SCORE_FILTER_OPTIONS = [
  { value: "all", label: "All scores" },
  { value: "90", label: "90+" },
  { value: "80", label: "80–89" },
  { value: "70", label: "70–79" },
  { value: "lt70", label: "Below 70" },
];

function PhoneIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1C10.07 21 3 13.93 3 5a1 1 0 011-1h3.5a1 1 0 011 1c0 1.24.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"
      />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        d="M3.5 9.5A6.5 6.5 0 0 1 14 5.5M16.5 10.5A6.5 6.5 0 0 1 6 14.5M14 5.5V2M14 5.5h-3M6 14.5v3M6 14.5h3"
      />
    </svg>
  );
}

const tabs = [
  { id: "live", label: "Live Calls" },
  { id: "ai", label: "AI Roleplays" },
  { id: "upload", label: "Upload" }
];

export default function DashboardCallLibrary() {
  const [activeTab, setActiveTab] = useState("live");
  const [repFilter, setRepFilter] = useState("all");
  const [scoreFilter, setScoreFilter] = useState("all");

  const emptyCopy =
    activeTab === "live"
      ? {
          list: "No live calls yet. Recorded calls will appear here.",
          mainTitle: "Select a call",
          mainBody: "Choose a recording from the list to view detailed analysis and key moments."
        }
      : activeTab === "ai"
        ? {
            list: "No AI roleplays yet. Completed sessions will appear here.",
            mainTitle: "Select a session",
            mainBody: "Choose an AI roleplay from the list to review scores and feedback."
          }
        : {
            list: "No uploads yet. Files you add will appear here.",
            mainTitle: "Select a file",
            mainBody: "Choose an upload from the list to view details and analysis."
          };

  return (
    <div className="db-cl-root">
      <div className="db-cl-layout">
        <aside className="db-cl-sidebar" aria-label="Call library filters">
          <header className="db-cl-head">
            <h1 className="db-cl-title">Call Library</h1>
            <p className="db-cl-subtitle">Recordings, AI sessions, uploads</p>
          </header>

          <div className="db-cl-tabs" role="tablist" aria-label="Library source">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`db-cl-tab ${activeTab === tab.id ? "is-active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="db-cl-toolbar">
            <ThemedMenuSelect
              className="db-cl-menu-select"
              value={repFilter}
              onChange={setRepFilter}
              options={REP_FILTER_OPTIONS}
            />
            <ThemedMenuSelect
              className="db-cl-menu-select"
              value={scoreFilter}
              onChange={setScoreFilter}
              options={SCORE_FILTER_OPTIONS}
            />
            <button type="button" className="db-cl-refresh" aria-label="Refresh list">
              <RefreshIcon />
            </button>
          </div>

          <div className="db-cl-list-panel">
            <div className="db-cl-list-empty">
              <PhoneIcon className="db-cl-list-empty-icon" />
              <p>{emptyCopy.list}</p>
            </div>
          </div>
        </aside>

        <main className="db-cl-main" aria-label="Call detail">
          <div className="db-cl-main-empty">
            <div className="db-cl-main-icon-wrap">
              <PhoneIcon className="db-cl-main-phone" />
            </div>
            <h2 className="db-cl-main-title">{emptyCopy.mainTitle}</h2>
            <p className="db-cl-main-desc">{emptyCopy.mainBody}</p>
          </div>
        </main>
      </div>

    </div>
  );
}
