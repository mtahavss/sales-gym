import { useEffect } from "react";
import "./CallFinishedModal.css";

function CheckSuccessIcon() {
  return (
    <svg className="cfm-check-icon" width="52" height="52" viewBox="0 0 52 52" aria-hidden="true">
      <circle cx="26" cy="26" r="24" fill="#dcfce7" stroke="#86efac" strokeWidth="1.5" />
      <path
        d="M17 26.5l6 6 12-14"
        fill="none"
        stroke="#16a34a"
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * @param {{
 *   isDark: boolean;
 *   onBackToDashboard: () => void;
 *   onStartNewSession: () => void;
 * }} props
 */
export default function CallFinishedModal({ isDark, onBackToDashboard, onStartNewSession }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") {
        onBackToDashboard();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBackToDashboard]);

  return (
    <div className="cfm-overlay" role="presentation">
      <div
        className={`cfm-card${isDark ? " is-dark" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cfm-title"
      >
        <div className="cfm-inner">
          <CheckSuccessIcon />
          <h2 id="cfm-title" className="cfm-title">
            Call Finished
          </h2>
          <p className="cfm-body">
            We&apos;re analyzing your call now. It can take a couple of minutes for the transcript and recording to
            appear in your SalesGym dashboard.
          </p>
          <div className="cfm-actions">
            <button type="button" className="cfm-btn cfm-btn--secondary" onClick={onBackToDashboard}>
              Back to AI Roleplay
            </button>
            <button type="button" className="cfm-btn cfm-btn--primary" onClick={onStartNewSession}>
              Start New Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
