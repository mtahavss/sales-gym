import { useCallback, useEffect, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import "./TrainingSessionPage.css";
import { TRAINING_SESSION_MODE } from "../../lib/trainingSessionModes";
import { incrementAiProspectSessionCount } from "../../lib/aiProspects";
import {
  AI_ROLEPLAY_SESSION_SCENARIO_PREFIX,
  createTrainingSession,
  TRAINING_SESSIONS_CHANGED_EVENT,
} from "../../lib/trainingSessions";
import CallFinishedModal from "./CallFinishedModal";

function formatDuration(totalSeconds) {
  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m} min${m !== 1 ? "s" : ""}${s > 0 ? ` ${s}s` : ""}`;
}

function modeLabel(mode) {
  if (mode === TRAINING_SESSION_MODE.OBJECTION) return "Objection Handling";
  return "Standard Training";
}

function ArrowLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
    </svg>
  );
}

function MicOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 1.74-.5 3.37-1.38 4.74M12 19v4M8 23h8" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  );
}

function VideoOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M16 16v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function CloseXIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

/** Idle transcript — clock + history arrow (reference-style) */
function TranscriptIdleIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

function SalesTrainingStartIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 8c-1.5 0-2.5 1-2.5 2.2v.8h5v-.8C14.5 9 13.5 8 12 8z" />
      <path d="M9.5 11v1.5a2.5 2.5 0 0 0 5 0V11" />
      <path d="M12 3v2M9 4.5l1.2 1.2M15 4.5l-1.2 1.2" />
      <rect x="6" y="14" width="12" height="7" rx="2" />
      <path d="M9 18h.01M15 18h.01" />
    </svg>
  );
}

function ChevronDownIcon({ className }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

const PACING_OPTIONS = [
  { value: "slow", label: "Slow" },
  { value: "normal", label: "Normal" },
  { value: "fast", label: "Fast" },
];

const MIC_OPTIONS = [
  { value: "", label: "Default microphone" },
  { value: "array", label: "Microphone Array (if available)" },
];

/** @param {{ user: { id: string } | null | undefined }} props */
export default function TrainingSessionPage({ user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const micMenuRef = useRef(null);
  const pacingMenuRef = useRef(null);
  /** Avoid double increment if end is triggered twice before navigation. */
  const sessionCompletionCountedRef = useRef(false);

  const session = location.state;
  const prospectName = session?.prospect?.name ?? "Prospect";
  const trainingMode = session?.trainingMode ?? TRAINING_SESSION_MODE.STANDARD;

  const [showTranscript, setShowTranscript] = useState(true);
  const [pacing, setPacing] = useState("normal");
  const [callLive, setCallLive] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [micChoice, setMicChoice] = useState("");
  const [micMenuOpen, setMicMenuOpen] = useState(false);
  const [pacingMenuOpen, setPacingMenuOpen] = useState(false);
  const [callFinishedOpen, setCallFinishedOpen] = useState(false);

  const [themeMode, setThemeMode] = useState(() => {
    const savedTheme = window.localStorage.getItem("dashboard_theme");
    return savedTheme === "dark" || savedTheme === "light" || savedTheme === "system" ? savedTheme : "light";
  });
  const [systemPrefersDark, setSystemPrefersDark] = useState(() =>
    window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)").matches : false
  );

  useEffect(() => {
    if (!window.matchMedia) {
      return undefined;
    }
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    function handleChange(event) {
      setSystemPrefersDark(event.matches);
    }
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    function onStorage(e) {
      if (e.key === "dashboard_theme" && e.newValue) {
        if (e.newValue === "dark" || e.newValue === "light" || e.newValue === "system") {
          setThemeMode(e.newValue);
        }
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!micMenuOpen && !pacingMenuOpen) {
      return undefined;
    }
    function onDocPointerDown(e) {
      if (micMenuOpen && micMenuRef.current && !micMenuRef.current.contains(e.target)) {
        setMicMenuOpen(false);
      }
      if (pacingMenuOpen && pacingMenuRef.current && !pacingMenuRef.current.contains(e.target)) {
        setPacingMenuOpen(false);
      }
    }
    function onKey(e) {
      if (e.key === "Escape") {
        setMicMenuOpen(false);
        setPacingMenuOpen(false);
      }
    }
    document.addEventListener("pointerdown", onDocPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDocPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [micMenuOpen, pacingMenuOpen]);

  const theme = themeMode === "system" ? (systemPrefersDark ? "dark" : "light") : themeMode;

  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!callLive) {
      return undefined;
    }
    const t = window.setInterval(() => setElapsedSec((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, [callLive]);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    if (!callLive || !camOn) {
      stopStream();
      setVideoError(false);
      return undefined;
    }

    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((tr) => tr.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setVideoError(false);
      } catch {
        if (!cancelled) setVideoError(true);
      }
    })();

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [callLive, camOn, stopStream]);

  function handleStartCall() {
    setCallLive(true);
    setElapsedSec(0);
    setMessages([
      {
        id: `m-${Date.now()}`,
        role: "agent",
        time: "0:00",
        text: "You’re live with your AI prospect. Open the call the way you normally would.",
      },
    ]);
  }

  const goAiRoleplay = useCallback(() => {
    navigate("/dashboard/ai-roleplay", { replace: true });
  }, [navigate]);

  async function endSession() {
    stopStream();
    setCallLive(false);
    if (
      callLive &&
      session?.prospectId &&
      user?.id &&
      !sessionCompletionCountedRef.current
    ) {
      sessionCompletionCountedRef.current = true;
      try {
        await incrementAiProspectSessionCount({
          id: session.prospectId,
          userId: user.id,
        });
        try {
          await createTrainingSession({
            userId: user.id,
            closerName: prospectName,
            goal: "AI Roleplay",
            scenario: `${AI_ROLEPLAY_SESSION_SCENARIO_PREFIX} prospect=${session.prospectId} mode=${trainingMode}`,
          });
          window.dispatchEvent(new CustomEvent(TRAINING_SESSIONS_CHANGED_EVENT));
        } catch (logErr) {
          console.warn("Could not log AI roleplay session to training_sessions:", logErr);
        }
      } catch (e) {
        sessionCompletionCountedRef.current = false;
        console.warn("Could not update prospect session count:", e);
      }
    }
    setCallFinishedOpen(true);
  }

  if (!user?.id) {
    return <Navigate to="/login" replace />;
  }

  if (!session?.prospectId || !session?.trainingMode) {
    return <Navigate to="/dashboard/ai-roleplay" replace />;
  }

  return (
    <div className={`ts-call-root${theme === "dark" ? " is-dark" : ""}`}>
      {callFinishedOpen ? (
        <CallFinishedModal
          isDark={theme === "dark"}
          onBackToDashboard={goAiRoleplay}
          onStartNewSession={goAiRoleplay}
        />
      ) : null}
      <div className="ts-page" aria-hidden={callFinishedOpen}>
      <header className="ts-header">
        <div className="ts-header-brand">
          <span className="ts-header-logo" aria-hidden="true" />
          <div className="ts-header-titles">
            <h1 className="ts-header-title">SalesGym · Live session</h1>
            <p className="ts-header-sub">
              {prospectName} · {modeLabel(trainingMode)}
            </p>
          </div>
        </div>
        <div className="ts-header-right">
          {callLive ? (
            <span className="ts-signal">
              <span className="ts-signal-dot" aria-hidden="true" />
              Signal: Excellent
            </span>
          ) : null}
          <Link className="ts-back" to="/dashboard">
            <ArrowLeftIcon />
            Back to dashboard
          </Link>
        </div>
      </header>

      <div className="ts-main">
        <aside className="ts-transcript" aria-label="Transcription">
          <div className="ts-transcript-head">
            <h2 className="ts-transcript-title">Transcription</h2>
            <div className="ts-transcript-controls">
              <label className="ts-check">
                <input
                  type="checkbox"
                  checked={showTranscript}
                  onChange={(e) => setShowTranscript(e.target.checked)}
                />
                Show transcript
              </label>
              <div>
                <div className="ts-pacing-label">Pacing</div>
                <div className="ts-pacing-dropdown" ref={pacingMenuRef}>
                  <button
                    type="button"
                    className={`ts-pacing-dropdown-trigger${pacingMenuOpen ? " is-open" : ""}`}
                    aria-haspopup="listbox"
                    aria-expanded={pacingMenuOpen}
                    aria-label="Conversation pacing"
                    onClick={() => setPacingMenuOpen((o) => !o)}
                  >
                    <span className="ts-pacing-dropdown-value">
                      {PACING_OPTIONS.find((o) => o.value === pacing)?.label ?? "Normal"}
                    </span>
                    <ChevronDownIcon className="ts-pacing-dropdown-chevron" />
                  </button>
                  {pacingMenuOpen ? (
                    <ul className="ts-pacing-dropdown-menu" role="listbox" aria-label="Pacing options">
                      {PACING_OPTIONS.map((opt) => (
                        <li key={opt.value} role="none">
                          <button
                            type="button"
                            role="option"
                            aria-selected={pacing === opt.value}
                            className={`ts-pacing-dropdown-item${pacing === opt.value ? " is-selected" : ""}`}
                            onClick={() => {
                              setPacing(opt.value);
                              setPacingMenuOpen(false);
                            }}
                          >
                            {opt.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
          {showTranscript ? (
            <div className="ts-transcript-feed" role="log" aria-live="polite">
              {!callLive && messages.length === 0 ? (
                <div className="ts-transcript-idle">
                  <div className="ts-transcript-idle-icon" aria-hidden="true">
                    <TranscriptIdleIcon />
                  </div>
                  <p className="ts-transcript-idle-title">No transcript yet</p>
                  <p className="ts-transcript-idle-hint">Start sales training to begin. Lines will show here as you talk.</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`ts-msg ${msg.role === "you" ? "ts-msg--you" : "ts-msg--agent"}`}
                  >
                    <div className="ts-msg-time">{msg.time}</div>
                    <div className="ts-msg-role">{msg.role === "you" ? "You" : "Agent"}</div>
                    {msg.text}
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="ts-transcript-feed" aria-hidden="true" />
          )}
          <div className="ts-transcript-footer">
            <ClockIcon />
            <span>Call duration</span>
            <span className="ts-duration-val">{formatDuration(elapsedSec)}</span>
          </div>
        </aside>

        <div className="ts-right">
          {callLive ? (
            <section className="ts-viz-panel" aria-label="Voice activity">
              <div className="ts-viz-dots" aria-hidden="true">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span key={i} className="ts-viz-dot" />
                ))}
              </div>
              <button type="button" className="ts-end-btn" onClick={endSession} aria-label="End session">
                <CloseXIcon />
              </button>
            </section>
          ) : (
            <section className="ts-start-card" aria-label="Start training">
              <button type="button" className="ts-start-btn" onClick={handleStartCall}>
                <span className="ts-start-btn-circle">
                  <SalesTrainingStartIcon />
                </span>
                <span className="ts-start-btn-label">Start sales training</span>
              </button>
            </section>
          )}

          <section className="ts-video-panel" aria-label="Your camera">
            <div className="ts-video-surface">
              {callLive && camOn && !videoError ? (
                <video ref={videoRef} className="ts-video" autoPlay playsInline muted />
              ) : (
                <div className="ts-video-placeholder">
                  {!callLive ? (
                    <>
                      <span className="ts-video-placeholder-icon" aria-hidden="true">
                        {camOn ? <VideoIcon /> : <VideoOffIcon />}
                      </span>
                      <span>
                        {camOn
                          ? "Camera will turn on when you start sales training."
                          : "Camera preview appears after you start."}
                      </span>
                    </>
                  ) : videoError ? (
                    "Camera unavailable — check permissions or try again."
                  ) : (
                    <>
                      <span className="ts-video-placeholder-icon" aria-hidden="true">
                        <VideoOffIcon />
                      </span>
                      <span>Camera is off — turn it on below when you’re ready.</span>
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="ts-video-controls">
              <button
                type="button"
                className={`ts-media-btn${micOn ? "" : " is-off"}`}
                onClick={() => setMicOn((v) => !v)}
                aria-pressed={micOn}
                aria-label={micOn ? "Mute microphone" : "Unmute microphone"}
              >
                {micOn ? <MicIcon /> : <MicOffIcon />}
              </button>
              <button
                type="button"
                className={`ts-media-btn${camOn ? "" : " is-off"}`}
                onClick={() => setCamOn((v) => !v)}
                aria-pressed={camOn}
                aria-label={camOn ? "Turn off camera" : "Turn on camera"}
              >
                {camOn ? <VideoIcon /> : <VideoOffIcon />}
              </button>
              <div className="ts-mic-dropdown" ref={micMenuRef}>
                <button
                  type="button"
                  className={`ts-mic-dropdown-trigger${micMenuOpen ? " is-open" : ""}`}
                  aria-haspopup="listbox"
                  aria-expanded={micMenuOpen}
                  aria-label="Microphone"
                  onClick={() => setMicMenuOpen((o) => !o)}
                >
                  <span className="ts-mic-dropdown-value">
                    {MIC_OPTIONS.find((o) => o.value === micChoice)?.label ?? MIC_OPTIONS[0].label}
                  </span>
                  <ChevronDownIcon className="ts-mic-dropdown-chevron" />
                </button>
                {micMenuOpen ? (
                  <ul className="ts-mic-dropdown-menu" role="listbox" aria-label="Choose microphone">
                    {MIC_OPTIONS.map((opt) => (
                      <li key={opt.value || "default"} role="none">
                        <button
                          type="button"
                          role="option"
                          aria-selected={micChoice === opt.value}
                          className={`ts-mic-dropdown-item${micChoice === opt.value ? " is-selected" : ""}`}
                          onClick={() => {
                            setMicChoice(opt.value);
                            setMicMenuOpen(false);
                          }}
                        >
                          {opt.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      </div>
      </div>
    </div>
  );
}
