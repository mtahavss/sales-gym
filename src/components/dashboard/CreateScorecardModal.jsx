import { useEffect } from "react";
import "./CreateScorecardModal.css";

const TEMPLATES = [
  {
    id: "discovery",
    title: "Discovery Call",
    description: "For initial qualification calls",
    tags: [
      "Discovery & Needs Analysis",
      "Pitch & Value Proposition",
      "Objection Handling",
      "Close & Next Steps",
    ],
  },
  {
    id: "demo",
    title: "Demo Call",
    description: "For product demonstrations",
    tags: ["Demo Preparation", "Value Delivery", "Objection Handling", "Next Steps"],
  },
  {
    id: "closing",
    title: "Closing Call",
    description: "For deal closing conversations",
    tags: ["Pre-Close Recap", "Negotiation", "Commitment", "Post-Close"],
  },
];

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

/**
 * @param {{ onClose: () => void; onChoose?: (choice: { mode: 'template' | 'scratch'; templateId?: string }) => void }} props
 */
export default function CreateScorecardModal({ onClose, onChoose }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleOverlayMouseDown(e) {
    if (e.target === e.currentTarget) onClose();
  }

  function pickTemplate(templateId) {
    onChoose?.({ mode: "template", templateId });
    onClose();
  }

  function pickScratch() {
    onChoose?.({ mode: "scratch" });
    onClose();
  }

  return (
    <div className="csc-overlay" onMouseDown={handleOverlayMouseDown} role="presentation">
      <div
        className="csc-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="csc-dialog-title"
        aria-describedby="csc-dialog-desc"
      >
        <div className="csc-header">
          <div>
            <h2 id="csc-dialog-title" className="csc-title">
              Create Scorecard
            </h2>
            <p id="csc-dialog-desc" className="csc-subtitle">
              Scorecards tell the AI what to evaluate on each call
            </p>
          </div>
          <button type="button" className="csc-close-btn" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <div className="csc-body">
          <p className="csc-section-label">Start from a template</p>
          <div className="csc-template-list">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                className="csc-template-card"
                onClick={() => pickTemplate(t.id)}
              >
                <span className="csc-template-title">{t.title}</span>
                <span className="csc-template-desc">{t.description}</span>
                <span className="csc-tag-row" aria-hidden="true">
                  {t.tags.map((tag) => (
                    <span key={tag} className="csc-tag">
                      {tag}
                    </span>
                  ))}
                </span>
              </button>
            ))}
          </div>

          <div className="csc-or-wrap" aria-hidden="true">
            <span className="csc-or-line" />
            <span className="csc-or-text">OR</span>
            <span className="csc-or-line" />
          </div>

          <button type="button" className="csc-scratch-btn" onClick={pickScratch}>
            Start from scratch
          </button>
        </div>

        <div className="csc-footer">
          <button type="button" className="csc-cancel-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
