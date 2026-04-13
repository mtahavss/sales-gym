import { useEffect } from "react";
import "./SelectTrainingModeModal.css";
import { TRAINING_SESSION_MODE } from "../../lib/trainingSessionModes";

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function PersonTrainingIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function ObjectionIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function buildTrainingObjectivesText(p, formData) {
  const fd = formData && typeof formData === "object" ? formData : {};
  const chunks = [
    fd.trainingGoals && String(fd.trainingGoals).trim(),
    fd.expectedChallenges && String(fd.expectedChallenges).trim(),
    p?.description && String(p.description).trim(),
  ].filter(Boolean);
  if (chunks.length > 0) {
    return chunks.join(" ");
  }
  return "Practice and improve your sales skills in a safe, AI-guided roleplay tailored to this prospect.";
}

/**
 * @param {{
 *   prospect: Record<string, unknown>;
 *   dbRow: { id: string; form_data?: Record<string, unknown> } | null;
 *   onClose: () => void;
 *   onStartSession: (payload: {
 *     trainingMode: string;
 *     prospectId: string;
 *     prospect: Record<string, unknown>;
 *     formData: Record<string, unknown>;
 *   }) => void;
 * }} props
 */
export default function SelectTrainingModeModal({ prospect, dbRow, onClose, onStartSession }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const formData = dbRow?.form_data && typeof dbRow.form_data === "object" ? dbRow.form_data : {};
  const prospectId = dbRow?.id ?? prospect?.id ?? "";
  const objectives = buildTrainingObjectivesText(prospect, formData);
  const industryLabel =
    prospect?.industry && String(prospect.industry).trim()
      ? prospect.industry
      : prospect?.accent === "B2C"
        ? "Consumer prospect"
        : "Business prospect";
  const initials = prospect?.initials || "?";

  function handleOverlayMouseDown(e) {
    if (e.target === e.currentTarget) onClose();
  }

  function startWithMode(trainingMode) {
    if (!prospectId) return;
    onStartSession({
      trainingMode,
      prospectId,
      prospect,
      formData: { ...formData },
    });
    onClose();
  }

  return (
    <div className="stm-overlay" onMouseDown={handleOverlayMouseDown} role="presentation">
      <div
        className="stm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="stm-dialog-title"
        aria-describedby="stm-dialog-desc"
      >
        <div className="stm-header">
          <button type="button" className="stm-close" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
          <div className="stm-title-row">
            <h2 id="stm-dialog-title" className="stm-title">
              Select Training Mode
            </h2>
            <span
              className="stm-info-btn"
              title="Pick how you want to practise with this prospect. Your choice is passed to the AI for the upcoming session."
            >
              i
            </span>
          </div>
          <p id="stm-dialog-desc" className="stm-subtitle">
            Choose your preferred training approach with this prospect
          </p>
        </div>

        <div className="stm-body">
          <div className="stm-prospect">
            <div className="stm-prospect-banner">
              <div className="stm-prospect-banner-media" aria-hidden="true" />
              <span
                className={`stm-prospect-tag${prospect?.accent === "B2C" ? " stm-prospect-tag--b2c" : ""}`}
              >
                {prospect?.accent ?? "B2B"}
              </span>
              <div className="stm-prospect-photo" aria-hidden="true">
                {initials}
              </div>
            </div>
            <div className="stm-prospect-body">
              <h3 className="stm-prospect-name">{prospect?.name ?? "Prospect"}</h3>
              <p className="stm-prospect-role">{prospect?.role ?? ""}</p>
              <span className="stm-prospect-industry">{industryLabel}</span>
              <p className="stm-objectives-label">TRAINING OBJECTIVES</p>
              <p className="stm-objectives-text">{objectives}</p>
            </div>
          </div>

          <div className="stm-modes">
            <div className="stm-mode-card">
              <div className="stm-mode-icon stm-mode-icon--standard" aria-hidden="true">
                <PersonTrainingIcon />
              </div>
              <h4 className="stm-mode-title">Standard Training</h4>
              <p className="stm-mode-desc">
                Sales conversation practice with realistic customer interactions and scenarios.
              </p>
              <button
                type="button"
                className="stm-mode-start"
                onClick={() => startWithMode(TRAINING_SESSION_MODE.STANDARD)}
              >
                Start
              </button>
            </div>
            <div className="stm-mode-card">
              <div className="stm-mode-icon stm-mode-icon--objection" aria-hidden="true">
                <ObjectionIcon />
              </div>
              <h4 className="stm-mode-title">Objection Handling</h4>
              <p className="stm-mode-desc">
                Specialized training for addressing customer concerns and overcoming sales objections.
              </p>
              <button
                type="button"
                className="stm-mode-start"
                onClick={() => startWithMode(TRAINING_SESSION_MODE.OBJECTION)}
              >
                Start
              </button>
            </div>
          </div>

          <p className="stm-recommendation">
            <strong>Recommendation:</strong> Begin with Standard Training to establish fundamentals, then advance to
            Objection Handling.
          </p>
        </div>
      </div>
    </div>
  );
}
