import { useEffect, useRef, useState } from "react";

const API_BASE = "http://localhost:4001";

/* ── Icons ────────────────────────────────────────────────── */
function ChatBubbleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 2.98.97 4.29L1 23l6.71-1.97A9.96 9.96 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18a7.94 7.94 0 0 1-4.1-1.14l-.3-.18-3.12.92.83-3.03-.2-.32A8.02 8.02 0 0 1 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M5 5l10 10M15 5L5 15" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M2.5 2.5l15 7.5-15 7.5V12l10-2-10-2V2.5z" />
    </svg>
  );
}

function MinimiseIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M4 10h12" />
    </svg>
  );
}

/* ── Markdown-lite renderer ───────────────────────────────── */
function renderText(text) {
  return text.split("\n").map((line, i) => {
    // Bold **text**
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={j}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
    return (
      <span key={i}>
        {parts}
        {i < text.split("\n").length - 1 && <br />}
      </span>
    );
  });
}

/* ── Typing indicator ─────────────────────────────────────── */
function TypingDots() {
  return (
    <div className="cw-msg cw-msg-bot">
      <div className="cw-typing">
        <span /><span /><span />
      </div>
    </div>
  );
}

/* ── Component ────────────────────────────────────────────── */
const WELCOME = "👋 Hi! I'm the SalesGym support bot. Ask me anything about features, your account, calls, scorecards, or how to get started!";

export default function ChatWidget({ user }) {
  const [open, setOpen] = useState(false);
  const [minimised, setMinimised] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { id: 1, from: "bot", text: WELCOME }
  ]);
  const [typing, setTyping] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (open && !minimised) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, typing, open, minimised]);

  // Focus input when opening
  useEffect(() => {
    if (open && !minimised) {
      setTimeout(() => inputRef.current?.focus(), 80);
      setUnread(0);
    }
  }, [open, minimised]);

  async function sendMessage() {
    const text = input.trim();
    if (!text) return;

    const userMsg = { id: Date.now(), from: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, userId: user?.id })
      });
      const data = await res.json();
      const botMsg = { id: Date.now() + 1, from: "bot", text: data.reply || "Sorry, I couldn't process that. Please try again." };
      setMessages((prev) => [...prev, botMsg]);
      if (!open || minimised) setUnread((n) => n + 1);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, from: "bot", text: "I'm having trouble connecting right now. Please try again in a moment, or email us at support@virtualsalessociety.ca." }
      ]);
    } finally {
      setTyping(false);
    }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function handleOpen() {
    setOpen(true);
    setMinimised(false);
    setUnread(0);
  }

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "there";

  return (
    <div className="cw-root">
      {/* ── Chat panel ── */}
      {open && (
        <div className={`cw-panel ${minimised ? "cw-panel-minimised" : ""}`} role="dialog" aria-label="Support chat">
          {/* Header */}
          <div className="cw-header">
            <div className="cw-header-left">
              <span className="cw-header-avatar">SG</span>
              <div>
                <p className="cw-header-name">SalesGym Support</p>
                <p className="cw-header-status"><span className="cw-status-dot" />Online</p>
              </div>
            </div>
            <div className="cw-header-actions">
              <button
                type="button"
                className="cw-icon-btn"
                aria-label="Minimise chat"
                onClick={() => setMinimised((m) => !m)}
              >
                <MinimiseIcon />
              </button>
              <button
                type="button"
                className="cw-icon-btn"
                aria-label="Close chat"
                onClick={() => setOpen(false)}
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {!minimised && (
            <>
              {/* Messages */}
              <div className="cw-messages">
                {messages.map((msg) => (
                  <div key={msg.id} className={`cw-msg cw-msg-${msg.from}`}>
                    {msg.from === "bot" && (
                      <span className="cw-bot-avatar">SG</span>
                    )}
                    <div className="cw-bubble">
                      {renderText(msg.text)}
                    </div>
                  </div>
                ))}
                {typing && <TypingDots />}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="cw-input-row">
                <textarea
                  ref={inputRef}
                  className="cw-input"
                  placeholder={`Message SalesGym support…`}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  rows={1}
                  aria-label="Type a message"
                />
                <button
                  type="button"
                  className="cw-send-btn"
                  onClick={sendMessage}
                  disabled={!input.trim() || typing}
                  aria-label="Send message"
                >
                  <SendIcon />
                </button>
              </div>
              <p className="cw-footer-note">Powered by SalesGym AI · press Enter to send</p>
            </>
          )}
        </div>
      )}

      {/* ── FAB button ── */}
      {!open && (
        <button
          type="button"
          className="cw-fab"
          aria-label="Open support chat"
          onClick={handleOpen}
        >
          <ChatBubbleIcon />
          {unread > 0 && <span className="cw-badge">{unread}</span>}
        </button>
      )}
    </div>
  );
}
