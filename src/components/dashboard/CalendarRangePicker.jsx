import { useState, useMemo } from "react";
import { useDateRange, formatDateShort } from "../../lib/DateRangeContext";

// ── Constants ──────────────────────────────────────────────────────────────────

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

const QUICK = [
  { label: "1W",  getDates: () => { const e = sod(new Date()); const s = addDays(e, -6); return { s, e }; } },
  { label: "1M",  getDates: () => { const e = sod(new Date()); const s = addDays(e, -29); return { s, e }; } },
  { label: "3M",  getDates: () => { const e = sod(new Date()); const s = addDays(e, -89); return { s, e }; } },
  { label: "6M",  getDates: () => { const e = sod(new Date()); const s = addDays(e, -179); return { s, e }; } },
  { label: "YTD", getDates: () => { const e = sod(new Date()); const s = new Date(e.getFullYear(), 0, 1); return { s, e }; } },
];

// ── Utils ──────────────────────────────────────────────────────────────────────

function sod(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
function isSameDay(a, b) {
  return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function isBetween(d, s, e) {
  if (!d || !s || !e) return false;
  const t = d.getTime(), st = Math.min(s.getTime(), e.getTime()), et = Math.max(s.getTime(), e.getTime());
  return t > st && t < et;
}

function getRightMonth(year, month) {
  return month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 };
}

function buildCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];

  // Prev-month padding
  for (let i = firstDay; i > 0; i--) {
    days.push({ date: new Date(year, month, 1 - i), current: false });
  }
  // This month
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({ date: new Date(year, month, d), current: true });
  }
  // Next-month padding to fill 6 rows
  while (days.length < 42) {
    const idx = days.length - firstDay - daysInMonth + 1;
    days.push({ date: new Date(year, month + 1, idx), current: false });
  }
  return days;
}

// ── Month Grid ────────────────────────────────────────────────────────────────

function MonthGrid({ year, month, rangeStart, rangeEnd, hoverDate, selecting, onDayClick, onDayHover }) {
  const today = sod(new Date());
  const days  = useMemo(() => buildCalendarDays(year, month), [year, month]);

  function getDayClasses(date, current) {
    const isStart   = isSameDay(date, rangeStart);
    const isEnd     = isSameDay(date, rangeEnd);
    const preview   = selecting && hoverDate;
    const rangeEndEffective = rangeEnd || (preview ? hoverDate : null);
    const inRange   = rangeStart && rangeEndEffective && isBetween(date, rangeStart, rangeEndEffective);
    const isToday   = isSameDay(date, today);
    const isHover   = isSameDay(date, hoverDate) && selecting;

    // Determine strip direction for start/end caps
    let strip = "";
    if (isStart && rangeEndEffective && !isSameDay(rangeStart, rangeEndEffective)) strip = "strip-right";
    if (isEnd   && rangeStart         && !isSameDay(rangeStart, rangeEnd))         strip = "strip-left";
    if (preview && isStart && hoverDate && !isSameDay(rangeStart, hoverDate))       strip = "strip-right";

    return [
      "crp-day",
      !current     && "crp-day-other",
      isStart      && "crp-day-start",
      isEnd        && "crp-day-end",
      inRange      && "crp-day-in-range",
      isToday      && !isStart && !isEnd && "crp-day-today",
      isHover      && !isStart && "crp-day-hover",
      strip,
    ].filter(Boolean).join(" ");
  }

  return (
    <div className="crp-month">
      <p className="crp-month-label">{MONTH_NAMES[month]} {year}</p>
      <div className="crp-weekdays">
        {WEEKDAYS.map((d) => <span key={d}>{d}</span>)}
      </div>
      <div className="crp-days-grid">
        {days.map(({ date, current }, i) => (
          <button
            key={i}
            type="button"
            className={getDayClasses(date, current)}
            onClick={() => current && onDayClick(date)}
            onMouseEnter={() => current && onDayHover(date)}
            tabIndex={current ? 0 : -1}
            aria-label={date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          >
            <span className="crp-day-num">{date.getDate()}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function CalendarRangePicker({ onClose }) {
  const { start, end, setCustomRange, setPreset, presetId } = useDateRange();

  // Left calendar starts at the month of the current range start (or current month)
  const initDate = start || sod(new Date());
  const [leftYear,  setLeftYear]  = useState(initDate.getFullYear());
  const [leftMonth, setLeftMonth] = useState(initDate.getMonth());

  const [rangeStart, setRangeStart] = useState(start ? sod(start) : null);
  const [rangeEnd,   setRangeEnd]   = useState(end   ? sod(end)   : null);
  const [hoverDate,  setHoverDate]  = useState(null);
  const [selecting,  setSelecting]  = useState(false);
  const [activeQuick, setActiveQuick] = useState(null);

  const right = getRightMonth(leftYear, leftMonth);

  function prevMonth() {
    if (leftMonth === 0) { setLeftYear(y => y - 1); setLeftMonth(11); }
    else setLeftMonth(m => m - 1);
  }
  function nextMonth() {
    if (leftMonth === 11) { setLeftYear(y => y + 1); setLeftMonth(0); }
    else setLeftMonth(m => m + 1);
  }

  function handleDayClick(date) {
    setActiveQuick(null);
    if (!selecting || !rangeStart) {
      // First click — set start, clear end
      setRangeStart(date);
      setRangeEnd(null);
      setSelecting(true);
    } else {
      // Second click — set end (ensure start < end)
      const [s, e] = date >= rangeStart ? [rangeStart, date] : [date, rangeStart];
      setRangeEnd(e);
      setRangeStart(s);
      setSelecting(false);
    }
  }

  function handleQuick(q) {
    const { s, e } = q.getDates();
    setRangeStart(s);
    setRangeEnd(e);
    setSelecting(false);
    setActiveQuick(q.label);
    // Navigate left calendar to start month
    setLeftYear(s.getFullYear());
    setLeftMonth(s.getMonth());
    // Apply immediately to context and close
    setCustomRange(s, e);
    onClose();
  }

  function handleApply() {
    if (!rangeStart || !rangeEnd) return;
    setCustomRange(rangeStart, rangeEnd);
    onClose();
  }

  function handleCancel() {
    onClose();
  }

  const applyLabel = rangeStart && rangeEnd
    ? `${formatDateShort(rangeStart)} – ${formatDateShort(rangeEnd)}`
    : rangeStart
      ? `${formatDateShort(rangeStart)} – pick end date`
      : "Select a date range";

  return (
    <div className="crp-wrap">
      {/* Quick select row */}
      <div className="crp-quick-row">
        {QUICK.map((q) => (
          <button
            key={q.label}
            type="button"
            className={`crp-quick-btn${activeQuick === q.label ? " is-active" : ""}`}
            onClick={() => handleQuick(q)}
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* Calendars */}
      <div className="crp-calendars">
        {/* Left navigation */}
        <button type="button" className="crp-nav-btn crp-nav-prev" onClick={prevMonth} aria-label="Previous month">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>

        <MonthGrid
          year={leftYear} month={leftMonth}
          rangeStart={rangeStart} rangeEnd={rangeEnd}
          hoverDate={hoverDate} selecting={selecting}
          onDayClick={handleDayClick}
          onDayHover={setHoverDate}
        />

        <div className="crp-cal-divider" />

        <MonthGrid
          year={right.year} month={right.month}
          rangeStart={rangeStart} rangeEnd={rangeEnd}
          hoverDate={hoverDate} selecting={selecting}
          onDayClick={handleDayClick}
          onDayHover={setHoverDate}
        />

        {/* Right navigation */}
        <button type="button" className="crp-nav-btn crp-nav-next" onClick={nextMonth} aria-label="Next month">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>

      {/* Footer */}
      <div className="crp-footer">
        <span className="crp-range-preview">{applyLabel}</span>
        <div className="crp-footer-btns">
          <button type="button" className="crp-cancel-btn" onClick={handleCancel}>Cancel</button>
          <button
            type="button"
            className="crp-apply-btn"
            onClick={handleApply}
            disabled={!rangeStart || !rangeEnd}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
