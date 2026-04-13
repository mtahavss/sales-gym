import { useEffect } from "react";
import "./DeleteProspectConfirmModal.css";

/**
 * @param {{
 *   prospectName: string;
 *   onCancel: () => void;
 *   onConfirm: () => void | Promise<void>;
 *   busy?: boolean;
 * }} props
 */
export default function DeleteProspectConfirmModal({ prospectName, onCancel, onConfirm, busy = false }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape" && !busy) onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel, busy]);

  const safeName = prospectName.trim() || "this prospect";

  return (
    <div
      className="dpc-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
      role="presentation"
    >
      <div
        className="dpc-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dpc-title"
        aria-describedby="dpc-desc"
      >
        <h2 id="dpc-title" className="dpc-title">
          Remove Training Prospect
        </h2>
        <p id="dpc-desc" className="dpc-body">
          Are you sure you want to remove &quot;{safeName}&quot;? This action cannot be undone and all
          associated training data will be permanently deleted.
        </p>
        <div className="dpc-actions">
          <button type="button" className="dpc-btn dpc-btn--cancel" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="dpc-btn dpc-btn--remove" onClick={() => onConfirm()} disabled={busy}>
            {busy ? "Removing…" : "Remove Prospect"}
          </button>
        </div>
      </div>
    </div>
  );
}
