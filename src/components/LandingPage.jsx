import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useDateRange, inRange } from "../lib/DateRangeContext";
import { computeOverviewStatValues } from "../lib/overviewStats";
import { listTrainingSessions } from "../lib/trainingSessions";
import "./LandingPage.css";

const CAROUSEL_AUTOPLAY_MS = 3000;

const heroHeadlines = ["Turn Sales Knowledge Into AI-Powered Performance"];

const reps = [
  {
    id: "maria",
    name: "Maria",
    avatarTone: "tone-maria"
  },
  {
    id: "lucas",
    name: "Lucas",
    avatarTone: "tone-lucas"
  },
  {
    id: "marcus",
    name: "Marcus",
    avatarTone: "tone-marcus"
  }
];

/** @param {{ avgCallScore: number; totalCalls: number }} props */
function RepAvgCallScoreGauge({ avgCallScore, totalCalls }) {
  const cx = 100;
  const cy = 96;
  const r = 74;
  const strokeW = 10;
  const arcPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  const arcLen = Math.PI * r;
  const pct = Math.min(100, Math.max(0, Number(avgCallScore) || 0));
  const filled = (pct / 100) * arcLen;

  const subLabel =
    totalCalls === 0
      ? "No calls in range"
      : pct >= 90
        ? "Above target"
        : `${90 - pct} pts to 90%`;

  const tickCount = 13;
  const tickLines = [];
  for (let i = 0; i < tickCount; i += 1) {
    const phi = Math.PI * (1 - i / (tickCount - 1));
    const cos = Math.cos(phi);
    const sin = Math.sin(phi);
    const inner = r - strokeW / 2 - 7;
    const outer = r - strokeW / 2 + 1.5;
    tickLines.push(
      <line
        key={i}
        x1={cx + inner * cos}
        y1={cy - inner * sin}
        x2={cx + outer * cos}
        y2={cy - outer * sin}
        className="rep-gauge-tick"
      />
    );
  }

  return (
    <div
      className="rep-overview-gauge-chart"
      role="img"
      aria-label={`Average call score ${pct} percent. ${subLabel}`}
    >
      <svg className="rep-overview-gauge-svg" viewBox="0 0 200 118" aria-hidden="true">
        {tickLines}
        <path
          className="rep-gauge-arc rep-gauge-arc--track"
          d={arcPath}
          fill="none"
          strokeWidth={strokeW}
          strokeLinecap="round"
        />
        <path
          className="rep-gauge-arc rep-gauge-arc--fill"
          d={arcPath}
          fill="none"
          strokeWidth={strokeW}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${arcLen}`}
        />
        <text x={cx - r} y={cy + 16} className="rep-gauge-label rep-gauge-label--min">
          0%
        </text>
        <text x={cx + r} y={cy + 16} className="rep-gauge-label rep-gauge-label--max" textAnchor="end">
          100%
        </text>
      </svg>
      <div className="rep-overview-gauge-center">
        <span className="rep-overview-gauge-pct">{pct}%</span>
        <span className="rep-overview-gauge-sub">{subLabel}</span>
      </div>
    </div>
  );
}

/** @param {{ variant: 'calls' | 'time' }} props */
function RepOverviewSparkline({ variant }) {
  const d =
    variant === "calls"
      ? "M2 18 L9 10 L16 15 L24 7 L32 13 L46 5"
      : "M2 8 L11 16 L20 9 L29 14 L38 6 L46 12";
  return (
    <svg className={`rep-overview-spark rep-overview-spark--${variant}`} viewBox="0 0 48 26" aria-hidden="true">
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** @param {{ avgCallScore: number; totalCalls: number; trainingTimeDisplay: string }} props */
function RepOverviewMiniStats({ avgCallScore, totalCalls, trainingTimeDisplay }) {
  return (
    <div className="rep-overview-stack" aria-label="Team overview stats">
      <div className="rep-overview-gauge-panel">
        <span className="rep-overview-gauge-title">Avg Call Score</span>
        <RepAvgCallScoreGauge avgCallScore={avgCallScore} totalCalls={totalCalls} />
      </div>
      <ul className="rep-overview-rows">
        <li className="rep-overview-row">
          <span className="rep-overview-row-icon rep-overview-row-icon--calls" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </span>
          <div className="rep-overview-row-text">
            <span className="rep-overview-row-label">Total Calls</span>
            <span className="rep-overview-row-value">{totalCalls}</span>
          </div>
          <RepOverviewSparkline variant="calls" />
        </li>
        <li className="rep-overview-row">
          <span className="rep-overview-row-icon rep-overview-row-icon--time" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </span>
          <div className="rep-overview-row-text">
            <span className="rep-overview-row-label">Training Time</span>
            <span className="rep-overview-row-value">{trainingTimeDisplay}</span>
          </div>
          <RepOverviewSparkline variant="time" />
        </li>
      </ul>
    </div>
  );
}

export default function LandingPage({ user }) {
  const [activeIndex, setActiveIndex] = useState(1);
  const [transitionDir, setTransitionDir] = useState("next");
  const [changeToken, setChangeToken] = useState(0);
  const [typedHeadline, setTypedHeadline] = useState("");
  const [headlineIndex, setHeadlineIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const autoplayRef = useRef(null);
  const carouselHoveredRef = useRef(false);
  const [sessions, setSessions] = useState([]);
  const { start: rangeStart, end: rangeEnd } = useDateRange();
  const totalReps = reps.length;

  const filteredSessions = useMemo(
    () => sessions.filter((s) => inRange(s.created_at, rangeStart, rangeEnd)),
    [sessions, rangeStart, rangeEnd]
  );

  const overviewStats = useMemo(
    () => computeOverviewStatValues(filteredSessions),
    [filteredSessions]
  );

  useEffect(() => {
    if (!user?.id) {
      setSessions([]);
      return undefined;
    }

    let cancelled = false;
    (async () => {
      try {
        const rows = await listTrainingSessions(user.id);
        if (!cancelled) {
          setSessions(rows);
        }
      } catch {
        if (!cancelled) {
          setSessions([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);
  const leftIndex = (activeIndex - 1 + totalReps) % totalReps;
  const rightIndex = (activeIndex + 1) % totalReps;

  const clearCarouselAutoplay = useCallback(() => {
    if (autoplayRef.current != null) {
      window.clearInterval(autoplayRef.current);
      autoplayRef.current = null;
    }
  }, []);

  const startCarouselAutoplay = useCallback(() => {
    clearCarouselAutoplay();
    if (carouselHoveredRef.current) {
      return;
    }
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    autoplayRef.current = window.setInterval(() => {
      setTransitionDir("next");
      setActiveIndex((i) => (i + 1) % totalReps);
      setChangeToken((t) => t + 1);
    }, CAROUSEL_AUTOPLAY_MS);
  }, [clearCarouselAutoplay, totalReps]);

  function handleCarouselPointerEnter() {
    carouselHoveredRef.current = true;
    clearCarouselAutoplay();
  }

  function handleCarouselPointerLeave() {
    carouselHoveredRef.current = false;
    startCarouselAutoplay();
  }

  useEffect(() => {
    startCarouselAutoplay();
    return clearCarouselAutoplay;
  }, [startCarouselAutoplay, clearCarouselAutoplay]);

  useEffect(() => {
    const currentHeadline = heroHeadlines[headlineIndex];
    const finishedTyping = typedHeadline === currentHeadline;
    const finishedDeleting = typedHeadline.length === 0;

    let nextDelay = isDeleting ? 45 : 85;

    if (finishedTyping && !isDeleting) {
      nextDelay = 1200;
    } else if (finishedDeleting && isDeleting) {
      nextDelay = 260;
    }

    const timeoutId = window.setTimeout(() => {
      if (finishedTyping && !isDeleting) {
        setIsDeleting(true);
        return;
      }

      if (finishedDeleting && isDeleting) {
        setIsDeleting(false);
        setHeadlineIndex((value) => (value + 1) % heroHeadlines.length);
        return;
      }

      setTypedHeadline((value) =>
        isDeleting
          ? currentHeadline.slice(0, value.length - 1)
          : currentHeadline.slice(0, value.length + 1)
      );
    }, nextDelay);

    return () => window.clearTimeout(timeoutId);
  }, [typedHeadline, isDeleting, headlineIndex]);

  function goToIndex(nextIndex) {
    if (nextIndex === activeIndex) {
      return;
    }

    const isNext = nextIndex === (activeIndex + 1) % totalReps;
    setTransitionDir(isNext ? "next" : "prev");
    setActiveIndex(nextIndex);
    setChangeToken((value) => value + 1);
    startCarouselAutoplay();
  }

  return (
    <main className="landing-page">
      <section className="hero" id="product">
        <p className="hero-kicker">AI Sales Coach</p>
        <h1 className="hero-typing-headline">
          <span className="typing-text">{typedHeadline}</span>
        </h1>
        <p className="hero-description">
          SalesGym reviews conversations, highlights coaching opportunities,
          and creates focused roleplay sessions so closers improve faster.
        </p>
        <div className="hero-cta">
          <Link to={user ? "/dashboard" : "/login"} className="btn btn-primary">
            {user ? "Open Dashboard" : "Get Started"}
          </Link>
        </div>
      </section>

      <section
        className="reps-carousel"
        aria-label="Sales reps carousel"
        onMouseEnter={handleCarouselPointerEnter}
        onMouseLeave={handleCarouselPointerLeave}
      >
        <div className="rep-manual-track">
          <article
            key={`left-${reps[leftIndex].id}-${changeToken}`}
            className={`rep-card rep-card-side rep-card-left rep-card-side-${transitionDir}`}
            onClick={() => goToIndex(leftIndex)}
            aria-label={`Show ${reps[leftIndex].name}`}
          >
            <div className="rep-banner" />
            <div className={`rep-avatar ${reps[leftIndex].avatarTone}`} aria-hidden="true">
              <span>{reps[leftIndex].name.charAt(0)}</span>
            </div>
            <div className="rep-body">
              <h3>{reps[leftIndex].name}</h3>
              <RepOverviewMiniStats
                avgCallScore={overviewStats.avgCallScore}
                totalCalls={overviewStats.totalCalls}
                trainingTimeDisplay={overviewStats.trainingTimeDisplay}
              />
            </div>
          </article>

          <article
            key={`${reps[activeIndex].id}-${transitionDir}-${changeToken}`}
            className={`rep-card rep-card-center rep-card-center-${transitionDir}`}
          >
            <div className="rep-banner" />
            <div className={`rep-avatar ${reps[activeIndex].avatarTone}`} aria-hidden="true">
              <span>{reps[activeIndex].name.charAt(0)}</span>
            </div>
            <div className="rep-body">
              <h3>{reps[activeIndex].name}</h3>
              <RepOverviewMiniStats
                avgCallScore={overviewStats.avgCallScore}
                totalCalls={overviewStats.totalCalls}
                trainingTimeDisplay={overviewStats.trainingTimeDisplay}
              />
            </div>
          </article>

          <article
            key={`right-${reps[rightIndex].id}-${changeToken}`}
            className={`rep-card rep-card-side rep-card-right rep-card-side-${transitionDir}`}
            onClick={() => goToIndex(rightIndex)}
            aria-label={`Show ${reps[rightIndex].name}`}
          >
            <div className="rep-banner" />
            <div className={`rep-avatar ${reps[rightIndex].avatarTone}`} aria-hidden="true">
              <span>{reps[rightIndex].name.charAt(0)}</span>
            </div>
            <div className="rep-body">
              <h3>{reps[rightIndex].name}</h3>
              <RepOverviewMiniStats
                avgCallScore={overviewStats.avgCallScore}
                totalCalls={overviewStats.totalCalls}
                trainingTimeDisplay={overviewStats.trainingTimeDisplay}
              />
            </div>
          </article>
        </div>

        <div className="rep-dots-wrap">
          <div className="rep-dots" aria-label="Carousel pagination">
            {reps.map((rep, index) => (
              <button
                key={rep.id}
                type="button"
                className={`rep-dot ${activeIndex === index ? "is-active" : ""}`}
                onClick={() => goToIndex(index)}
                aria-label={`Go to ${rep.name}`}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
