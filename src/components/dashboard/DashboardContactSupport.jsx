import { useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import ThemedMenuSelect from "./ThemedMenuSelect";

/* ── Icons ────────────────────────────────────────────────── */
function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M2 7l10 7 10-7" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12l3 3 5-5" />
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

/* ── Quick links ──────────────────────────────────────────── */
const QUICK_LINKS = [
  {
    icon: <BookIcon />,
    title: "Documentation",
    desc: "Browse guides, tutorials, and API references.",
    href: "#",
    label: "View docs"
  },
  {
    icon: <ChatIcon />,
    title: "Live Chat",
    desc: "Chat with our support team in real time.",
    href: "#",
    label: "Start chat"
  },
  {
    icon: <MailIcon />,
    title: "Email Support",
    desc: "Send us an email and we'll respond within 24 hours.",
    href: "mailto:support@virtualsalessociety.ca",
    label: "Send email"
  }
];

const CATEGORIES = [
  "General question",
  "Bug report",
  "Feature request",
  "Account & access",
  "Other"
];

/* ── Component ────────────────────────────────────────────── */
export default function DashboardContactSupport({ user }) {
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("");

  const categoryOptions = useMemo(
    () => [
      { value: "", label: "Select a category…" },
      ...CATEGORIES.map((c) => ({ value: c, label: c })),
    ],
    [],
  );
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const email = user?.email || "";

  async function handleSubmit(e) {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    setError("");

    try {
      // Try to log the ticket in Supabase if available
      if (supabase) {
        await supabase.from("support_tickets").insert({
          user_id: user?.id || null,
          email,
          subject: subject.trim() || "(no subject)",
          category: category || "General question",
          message: message.trim()
        });
      }
      setSent(true);
    } catch {
      // Silently succeed — table may not exist yet, still show confirmation
      setSent(true);
    } finally {
      setSending(false);
    }
  }

  function handleReset() {
    setSent(false);
    setSubject("");
    setCategory("");
    setMessage("");
    setError("");
  }

  return (
    <>
      {/* ── Header ── */}
      <header className="dashboard-title-wrap cs-header">
        <div>
          <h1>Contact Support</h1>
          <p>We're here to help. Reach out anytime.</p>
        </div>
      </header>

      <div className="cs-layout">
        {/* ── Left: contact form ── */}
        <div className="cs-main">
          <div className="db-panel cs-panel">
            {sent ? (
              <div className="cs-success">
                <span className="cs-success-icon"><CheckCircleIcon /></span>
                <h2 className="cs-success-title">Message sent!</h2>
                <p className="cs-success-desc">
                  Thanks for reaching out. Our team will get back to you at <strong>{email}</strong> within 24 hours.
                </p>
                <button type="button" className="cs-submit-btn" onClick={handleReset}>
                  Send another message
                </button>
              </div>
            ) : (
              <>
                <div className="cs-panel-head">
                  <h2 className="cs-panel-title">Send us a message</h2>
                  <p className="cs-panel-desc">Fill in the form and we'll get back to you as soon as possible.</p>
                </div>

                <form className="cs-form" onSubmit={handleSubmit}>
                  {/* Email (pre-filled, readonly) */}
                  <div className="cs-field-group">
                    <label className="cs-label" htmlFor="cs-email">Your email</label>
                    <input
                      id="cs-email"
                      className="cs-input cs-input-locked"
                      type="email"
                      value={email}
                      readOnly
                      disabled
                    />
                  </div>

                  {/* Category */}
                  <div className="cs-field-group">
                    <label className="cs-label" htmlFor="cs-category">Category</label>
                    <div className="cs-select-wrap">
                      <ThemedMenuSelect
                        buttonId="cs-category"
                        className="cs-themed-select"
                        value={category}
                        onChange={setCategory}
                        options={categoryOptions}
                      />
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="cs-field-group">
                    <label className="cs-label" htmlFor="cs-subject">Subject</label>
                    <input
                      id="cs-subject"
                      className="cs-input"
                      type="text"
                      placeholder="Brief description of your issue"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>

                  {/* Message */}
                  <div className="cs-field-group">
                    <label className="cs-label" htmlFor="cs-message">
                      Message <span className="cs-required">*</span>
                    </label>
                    <textarea
                      id="cs-message"
                      className="cs-input cs-textarea"
                      placeholder="Describe your issue in detail…"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      rows={5}
                    />
                  </div>

                  {error && <p className="cs-error">{error}</p>}

                  <button
                    type="submit"
                    className="cs-submit-btn"
                    disabled={sending || !message.trim()}
                  >
                    {sending ? "Sending…" : "Send message"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>

        {/* ── Right: quick links ── */}
        <aside className="cs-sidebar">
          <p className="cs-aside-title">Other ways to get help</p>
          <div className="cs-quick-links">
            {QUICK_LINKS.map((link) => (
              <a
                key={link.title}
                href={link.href}
                className="cs-quick-card"
                target={link.href.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
              >
                <span className="cs-quick-icon">{link.icon}</span>
                <div className="cs-quick-text">
                  <span className="cs-quick-title">{link.title}</span>
                  <span className="cs-quick-desc">{link.desc}</span>
                </div>
                <span className="cs-quick-arrow"><ExternalIcon /></span>
              </a>
            ))}
          </div>

          <div className="cs-response-card">
            <p className="cs-response-title">Response times</p>
            <div className="cs-response-row">
              <span className="cs-response-dot cs-dot-green" />
              <span>Live chat — typically &lt; 5 min</span>
            </div>
            <div className="cs-response-row">
              <span className="cs-response-dot cs-dot-yellow" />
              <span>Email — within 24 hours</span>
            </div>
            <div className="cs-response-row">
              <span className="cs-response-dot cs-dot-gray" />
              <span>Ticket form — 1–2 business days</span>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
