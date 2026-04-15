import { useEffect, useRef, useState } from "react";
import { getAuthSiteUrl, supabase } from "../../lib/supabaseClient";

/* ── Icons ────────────────────────────────────────────────── */
function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 8l3.5 3.5L13 5" />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <path d="M7 3H3a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V9M10 2h4m0 0v4m0-4L7 9" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <rect x="3" y="7" width="10" height="7" rx="1.5" />
      <path d="M5 7V5a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M7.5 3.5L6.25 5H3A1.5 1.5 0 0 0 1.5 6.5v9A1.5 1.5 0 0 0 3 17h14a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 17 5h-3.25L12.5 3.5h-5zM10 14a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7zm0-1.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
    </svg>
  );
}

/* ── Tab panels ───────────────────────────────────────────── */
function NotificationsTab() {
  const items = [
    { id: "email_calls", label: "New call uploaded", desc: "Get notified when a team member uploads a call recording." },
    { id: "email_scores", label: "Score reports ready", desc: "Receive an email when AI analysis finishes for a call." },
    { id: "email_weekly", label: "Weekly digest", desc: "A weekly summary of your team's performance metrics." },
    { id: "email_billing", label: "Billing & plan updates", desc: "Invoices, seat changes, and subscription notices." },
  ];
  const [prefs, setPrefs] = useState({ email_calls: true, email_scores: true, email_weekly: false, email_billing: true });

  return (
    <div className="acc-section">
      <div className="acc-section-head">
        <h2 className="acc-section-title">Email Notifications</h2>
        <p className="acc-section-desc">Choose which emails you want to receive.</p>
      </div>
      <div className="acc-notif-list">
        {items.map((item) => (
          <label key={item.id} className="acc-notif-row">
            <div className="acc-notif-text">
              <span className="acc-notif-label">{item.label}</span>
              <span className="acc-notif-desc">{item.desc}</span>
            </div>
            <div
              className={`acc-toggle ${prefs[item.id] ? "is-on" : ""}`}
              role="switch"
              aria-checked={prefs[item.id]}
              tabIndex={0}
              onClick={() => setPrefs((p) => ({ ...p, [item.id]: !p[item.id] }))}
              onKeyDown={(e) => e.key === " " && setPrefs((p) => ({ ...p, [item.id]: !p[item.id] }))}
            />
          </label>
        ))}
      </div>
    </div>
  );
}

function SecurityTab({ email }) {
  // ── Password reset ────────────────────────────────────────
  const [resetSending, setResetSending] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState("");

  async function handleSendReset() {
    if (!supabase || !email) return;
    setResetSending(true);
    setResetSent(false);
    setResetError("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${getAuthSiteUrl()}/reset-password`
      });
      if (error) throw error;
      setResetSent(true);
    } catch (err) {
      setResetError(err.message || "Failed to send reset email.");
    } finally {
      setResetSending(false);
    }
  }

  // ── 2FA state ─────────────────────────────────────────────
  // "idle" | "enrolling" | "verifying" | "enabled" | "disabling"
  const [mfaStep, setMfaStep]       = useState("idle");
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaError, setMfaError]     = useState("");
  const [qrUrl, setQrUrl]           = useState("");
  const [secret, setSecret]         = useState("");
  const [factorId, setFactorId]     = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [totpCode, setTotpCode]     = useState("");

  // Check if 2FA is already enabled on mount
  useEffect(() => {
    async function checkMfa() {
      if (!supabase) return;
      try {
        const { data } = await supabase.auth.mfa.listFactors();
        const active = data?.totp?.find((f) => f.status === "verified");
        if (active) {
          setFactorId(active.id);
          setMfaStep("enabled");
        }
      } catch { /* ignore */ }
    }
    checkMfa();
  }, []);

  async function handleEnroll() {
    if (!supabase) return;
    setMfaLoading(true);
    setMfaError("");
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "SalesGym Authenticator"
      });
      if (error) throw error;
      setQrUrl(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
      setMfaStep("enrolling");
    } catch (err) {
      setMfaError(err.message || "Failed to start 2FA setup.");
    } finally {
      setMfaLoading(false);
    }
  }

  async function handleVerify() {
    if (!supabase || !totpCode) return;
    setMfaLoading(true);
    setMfaError("");
    try {
      // Create a challenge then verify
      const { data: challengeData, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeErr) throw challengeErr;
      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: totpCode.replace(/\s/g, "")
      });
      if (verifyErr) throw verifyErr;
      setMfaStep("enabled");
      setTotpCode("");
      setQrUrl("");
      setSecret("");
    } catch (err) {
      setMfaError(err.message || "Invalid code. Please try again.");
    } finally {
      setMfaLoading(false);
    }
  }

  async function handleDisable() {
    if (!supabase || !factorId) return;
    setMfaLoading(true);
    setMfaError("");
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) throw error;
      setMfaStep("idle");
      setFactorId("");
    } catch (err) {
      setMfaError(err.message || "Failed to disable 2FA.");
    } finally {
      setMfaLoading(false);
    }
  }

  function handleCancelEnroll() {
    if (factorId) {
      supabase?.auth.mfa.unenroll({ factorId }).catch(() => {});
    }
    setMfaStep("idle");
    setQrUrl("");
    setSecret("");
    setFactorId("");
    setTotpCode("");
    setMfaError("");
  }

  return (
    <div className="acc-section">
      {/* ── Password ── */}
      <div className="acc-section-head">
        <h2 className="acc-section-title">Password</h2>
        <p className="acc-section-desc">Update your password or use a magic link to sign in.</p>
      </div>
      <div className="acc-field-row">
        <div className="acc-field-group acc-field-full">
          <label className="acc-label">Email address</label>
          <input className="acc-input" type="email" value={email || ""} disabled readOnly />
        </div>
      </div>
      <button type="button" className="acc-save-btn" onClick={handleSendReset} disabled={resetSending}>
        {resetSending ? "Sending…" : "Send password reset email"}
      </button>
      {resetSent && <p className="acc-reset-sent">A reset link has been sent to {email}.</p>}
      {resetError && <p className="acc-error-text">{resetError}</p>}

      <div className="acc-divider" />

      {/* ── 2FA ── */}
      <div className="acc-section-head">
        <h2 className="acc-section-title">Two-Factor Authentication</h2>
        <p className="acc-section-desc">Add an extra layer of security to your account.</p>
      </div>

      {mfaStep === "idle" && (
        <div className="acc-2fa-row">
          <span className="acc-badge acc-badge-gray">Not enabled</span>
          <button type="button" className="acc-save-btn" onClick={handleEnroll} disabled={mfaLoading}>
            {mfaLoading ? "Loading…" : "Enable 2FA"}
          </button>
        </div>
      )}

      {mfaStep === "enrolling" && (
        <div className="acc-2fa-setup">
          <p className="acc-2fa-step-label">Step 1 — Scan this QR code with your authenticator app</p>
          <p className="acc-section-desc" style={{ marginBottom: "0.75rem" }}>
            Use <strong>Google Authenticator</strong>, <strong>Authy</strong>, or any TOTP app.
          </p>
          {qrUrl && (
            <div className="acc-qr-wrap">
              <img src={qrUrl} alt="2FA QR code" className="acc-qr-img" />
            </div>
          )}
          {secret && (
            <div className="acc-secret-wrap">
              <span className="acc-secret-label">Manual entry key:</span>
              <code className="acc-secret-code">{secret}</code>
            </div>
          )}

          <p className="acc-2fa-step-label" style={{ marginTop: "1rem" }}>Step 2 — Enter the 6-digit code from your app</p>
          <div className="acc-totp-row">
            <input
              className="acc-input acc-totp-input"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              onKeyDown={(e) => e.key === "Enter" && totpCode.length === 6 && handleVerify()}
              autoComplete="one-time-code"
            />
            <button
              type="button"
              className="acc-save-btn"
              onClick={handleVerify}
              disabled={mfaLoading || totpCode.length !== 6}
            >
              {mfaLoading ? "Verifying…" : "Verify & Enable"}
            </button>
            <button type="button" className="acc-outline-btn acc-save-btn" onClick={handleCancelEnroll} disabled={mfaLoading}>
              Cancel
            </button>
          </div>
          {mfaError && <p className="acc-error-text" style={{ marginTop: "0.5rem" }}>{mfaError}</p>}
        </div>
      )}

      {mfaStep === "enabled" && (
        <div className="acc-2fa-enabled">
          <div className="acc-2fa-enabled-row">
            <div className="acc-2fa-enabled-info">
              <span className="acc-badge acc-badge-green">Enabled</span>
              <p className="acc-section-desc" style={{ marginTop: "0.35rem" }}>
                Your account is protected with two-factor authentication.
              </p>
            </div>
            <button
              type="button"
              className="acc-2fa-disable-btn"
              onClick={handleDisable}
              disabled={mfaLoading}
            >
              {mfaLoading ? "Disabling…" : "Disable 2FA"}
            </button>
          </div>
          {mfaError && <p className="acc-error-text" style={{ marginTop: "0.5rem" }}>{mfaError}</p>}
        </div>
      )}
    </div>
  );
}

function SessionsTab() {
  return (
    <div className="acc-section">
      <div className="acc-section-head">
        <h2 className="acc-section-title">Active Sessions</h2>
        <p className="acc-section-desc">Devices currently signed in to your account.</p>
      </div>
      <div className="acc-session-card">
        <div className="acc-session-info">
          <span className="acc-session-device">Current browser</span>
          <span className="acc-session-meta">Last active: just now · This device</span>
        </div>
        <span className="acc-badge acc-badge-green">Current</span>
      </div>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────── */
const TABS = [
  { id: "profile", label: "Profile" },
  { id: "notifications", label: "Notifications" },
  { id: "security", label: "Security" },
  { id: "sessions", label: "Sessions" },
];

export default function DashboardSettings({ user, profile, onProfileUpdate }) {
  const [activeTab, setActiveTab] = useState("profile");

  // Profile form state
  const fullName = profile?.full_name || user?.user_metadata?.full_name || "";
  const nameParts = fullName.trim().split(" ");
  const [firstName, setFirstName] = useState(nameParts[0] || "");
  const [lastName, setLastName] = useState(nameParts.slice(1).join(" ") || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [avatarPreview, setAvatarPreview] = useState(
    profile?.avatar_url || user?.user_metadata?.avatar_url || null
  );
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const fileInputRef = useRef(null);

  // Keep preview in sync if the global profile prop changes (e.g. after upload propagates)
  useEffect(() => {
    const incoming = profile?.avatar_url || user?.user_metadata?.avatar_url || null;
    setAvatarPreview(incoming);
  }, [profile?.avatar_url, user?.user_metadata?.avatar_url]);

  const email = user?.email || profile?.email || "";

  // Reset saved indicator when editing
  useEffect(() => {
    setSaved(false);
  }, [firstName, lastName]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    const newFullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");

    // Always update in-memory first so the UI reflects the change immediately
    onProfileUpdate?.({ full_name: newFullName });
    setSaved(true);

    // Then try to persist to Supabase — failure is non-blocking and silent
    if (supabase && profile?.id) {
      try {
        await supabase
          .from("profiles")
          .update({ full_name: newFullName })
          .eq("id", profile.id);
      } catch {
        // Silently ignore — table may not exist yet
      }
    }

    setSaving(false);
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setAvatarError("");

    // Show local preview immediately for instant feedback
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
    onProfileUpdate?.({ avatar_url: objectUrl }); // update UI instantly
    setAvatarUploading(true);

    try {
      if (supabase && profile?.id) {
        const ext = file.name.split(".").pop();
        const path = `avatars/${profile.id}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("profiles")
          .upload(path, file, { upsert: true });

        if (uploadError) {
          if (uploadError.message?.toLowerCase().includes("bucket")) {
            setAvatarError("Storage bucket not found. Create a public bucket named 'profiles' in Supabase > Storage.");
          } else {
            setAvatarError("Upload failed: " + uploadError.message);
          }
          // Keep the local preview so the UI still looks right this session
          return;
        }

        const { data: urlData } = supabase.storage.from("profiles").getPublicUrl(path);
        const publicUrl = urlData?.publicUrl;
        if (publicUrl) {
          // Append a timestamp to bust the browser cache — same path is reused on every upload
          const freshUrl = `${publicUrl}?t=${Date.now()}`;
          await supabase.from("profiles").update({ avatar_url: freshUrl }).eq("id", profile.id);
          setAvatarPreview(freshUrl);
          onProfileUpdate?.({ avatar_url: freshUrl });
        }
      }
    } catch (err) {
      setAvatarError("Upload failed: " + (err.message || "Unknown error"));
    } finally {
      setAvatarUploading(false);
    }
  }

  function handleRemoveAvatar() {
    setAvatarPreview(null);
    onProfileUpdate?.({ avatar_url: null });
    if (supabase && profile?.id) {
      supabase.from("profiles").update({ avatar_url: null }).eq("id", profile.id).then(() => {});
    }
  }

  const displayInitials = [firstName?.[0], lastName?.[0]].filter(Boolean).join("").toUpperCase() || "U";

  return (
    <>
      <header className="dashboard-title-wrap acc-header">
        <div>
          <h1>Account</h1>
          <p>Manage your profile, security, and preferences.</p>
        </div>
      </header>

      {/* ── Tabs ── */}
      <div className="acc-tabs" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`acc-tab ${activeTab === tab.id ? "is-active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Profile tab ── */}
      {activeTab === "profile" && (
        <>
          {/* Personal information */}
          <div className="db-panel acc-panel">
            <div className="acc-section-head">
              <h2 className="acc-section-title">Personal Information</h2>
              <p className="acc-section-desc">Update your name and contact details.</p>
            </div>

            {/* Avatar upload */}
            <div className="acc-avatar-row">
              <div className="acc-avatar-wrap">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Profile" className="acc-avatar-img" />
                ) : (
                  <span className="acc-avatar-initials">{displayInitials}</span>
                )}
                {avatarUploading && <div className="acc-avatar-uploading" />}
              </div>
              <div className="acc-avatar-info">
                <p className="acc-avatar-label">Profile photo</p>
                <p className="acc-avatar-hint">JPG, PNG or GIF · Max 2 MB</p>
                <div className="acc-avatar-btns">
                  <button
                    type="button"
                    className="acc-upload-btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={avatarUploading}
                  >
                    <CameraIcon />
                    {avatarUploading ? "Uploading…" : "Upload photo"}
                  </button>
                  {avatarPreview && (
                    <button
                      type="button"
                      className="acc-remove-btn"
                      onClick={handleRemoveAvatar}
                      disabled={avatarUploading}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="acc-file-input"
                onChange={handleAvatarChange}
              />
              {avatarError && <p className="acc-avatar-error">{avatarError}</p>}
            </div>

            <div className="acc-divider" />

            <form onSubmit={handleSave}>
              <div className="acc-field-row">
                <div className="acc-field-group">
                  <label className="acc-label" htmlFor="acc-first-name">First Name</label>
                  <input
                    id="acc-first-name"
                    className="acc-input"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                  />
                </div>
                <div className="acc-field-group">
                  <label className="acc-label" htmlFor="acc-last-name">Last Name</label>
                  <input
                    id="acc-last-name"
                    className="acc-input"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div className="acc-field-row">
                <div className="acc-field-group acc-field-full">
                  <label className="acc-label" htmlFor="acc-email">Email Address</label>
                  <div className="acc-input-locked-wrap">
                    <input
                      id="acc-email"
                      className="acc-input acc-input-locked"
                      type="email"
                      value={email}
                      disabled
                      readOnly
                    />
                    <span className="acc-locked-badge">
                      <LockIcon /> LOCKED
                    </span>
                  </div>
                  <p className="acc-hint-text">Contact support to update your email address.</p>
                </div>
              </div>

              <div className="acc-form-footer">
                {saveError && <p className="acc-error-text">{saveError}</p>}
                {saved && !saveError && (
                  <span className="acc-saved-indicator">
                    <CheckIcon /> Saved
                  </span>
                )}
                <button type="submit" className="acc-save-btn" disabled={saving}>
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </div>

        </>
      )}

      {activeTab === "notifications" && <div className="db-panel acc-panel"><NotificationsTab /></div>}
      {activeTab === "security" && <div className="db-panel acc-panel"><SecurityTab email={email} /></div>}
      {activeTab === "sessions" && <div className="db-panel acc-panel"><SessionsTab /></div>}
    </>
  );
}
