import { useState } from "react";
import DashboardPageHero from "./DashboardPageHero";
import CreateScorecardModal from "./CreateScorecardModal";

function PlusIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M10 4v12M4 10h12" />
    </svg>
  );
}

function ScorecardEmptyIcon() {
  return (
    <svg viewBox="0 0 56 56" aria-hidden="true" fill="none">
      <rect x="8" y="6" width="40" height="44" rx="5" fill="#fff7ed" stroke="#fed7aa" strokeWidth="1.5" />
      <rect x="14" y="14" width="18" height="2.5" rx="1.25" fill="#fed7aa" />
      <rect x="14" y="20" width="28" height="2.5" rx="1.25" fill="#fed7aa" />
      <rect x="14" y="26" width="22" height="2.5" rx="1.25" fill="#fed7aa" />
      <rect x="14" y="32" width="16" height="2.5" rx="1.25" fill="#fed7aa" />
      <circle cx="42" cy="42" r="9" fill="#f97316" />
      <path d="M38 42h8M42 38v8" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function DashboardScorecards() {
  const [scorecards, setScorecards] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <DashboardPageHero
        eyebrow="Manage"
        title="Scorecards"
        subtitle="Define what the AI should evaluate on calls — discovery, objections, closing, and more."
        helpLink={{
          href: "#",
          label: "Need help with scorecards? View docs",
          onClick: (e) => e.preventDefault(),
        }}
        secondaryAction={
          <button type="button" className="db-page-primary-btn">
            Get Certified
          </button>
        }
        primaryButton={{
          label: "New Scorecard",
          icon: <PlusIcon />,
          onClick: () => setCreateOpen(true),
        }}
        variant="scorecards"
      />

      {scorecards.length === 0 ? (
        <div className="sc-empty-wrap">
          <div className="sc-empty-card">
            <ScorecardEmptyIcon />
            <h2 className="sc-empty-title">No scorecards yet</h2>
            <p className="sc-empty-desc">
              Scorecards tell the AI what to look for when analyzing calls.
              For example: &ldquo;Did the rep ask good discovery questions?&rdquo; or
              &ldquo;Did they handle objections well?&rdquo;
            </p>
            <button
              type="button"
              className="sc-create-btn"
              onClick={() => setCreateOpen(true)}
            >
              <PlusIcon />
              Create Scorecard
            </button>
          </div>
        </div>
      ) : (
        <div className="sc-grid">
          {scorecards.map((sc) => (
            <div key={sc.id} className="sc-card">
              <h3 className="sc-card-title">{sc.name}</h3>
              <p className="sc-card-desc">{sc.description}</p>
            </div>
          ))}
        </div>
      )}

      {createOpen ? <CreateScorecardModal onClose={() => setCreateOpen(false)} /> : null}
    </>
  );
}
