import { createContext, useContext, useState } from "react";

// ── Helpers ────────────────────────────────────────────────────────────────────

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function computePreset(id) {
  const today = startOfDay(new Date());
  switch (id) {
    case "today":
      return { start: today, end: today };
    case "7d": {
      const s = new Date(today);
      s.setDate(s.getDate() - 6);
      return { start: s, end: today };
    }
    case "14d": {
      const s = new Date(today);
      s.setDate(s.getDate() - 13);
      return { start: s, end: today };
    }
    case "30d": {
      const s = new Date(today);
      s.setDate(s.getDate() - 29);
      return { start: s, end: today };
    }
    case "this-month":
      return {
        start: new Date(today.getFullYear(), today.getMonth(), 1),
        end: today,
      };
    case "last-month":
      return {
        start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
        end: new Date(today.getFullYear(), today.getMonth(), 0),
      };
    default:
      return { start: new Date(today.getFullYear(), today.getMonth(), 1), end: today };
  }
}

export const PRESETS = [
  { id: "today",      label: "Today" },
  { id: "7d",         label: "Last 7 days" },
  { id: "14d",        label: "Last 14 days" },
  { id: "30d",        label: "Last 30 days" },
  { id: "this-month", label: "This month" },
  { id: "last-month", label: "Last month" },
];

export function formatDateShort(d) {
  if (!d) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function inRange(dateStr, start, end) {
  if (!dateStr || !start || !end) return true;
  const d = startOfDay(new Date(dateStr));
  return d >= start && d <= end;
}

// ── Context ────────────────────────────────────────────────────────────────────

const DEFAULT_PRESET = "7d";
const { start: defStart, end: defEnd } = computePreset(DEFAULT_PRESET);

export const DateRangeContext = createContext({
  start: defStart,
  end: defEnd,
  presetId: DEFAULT_PRESET,
  label: "Last 7 days",
  setPreset: () => {},
  setCustomRange: () => {},
});

export function useDateRange() {
  return useContext(DateRangeContext);
}

// ── Provider ───────────────────────────────────────────────────────────────────

export function DateRangeProvider({ children }) {
  const [presetId, setPresetId]     = useState(DEFAULT_PRESET);
  const [range, setRange]           = useState(() => computePreset(DEFAULT_PRESET));
  const [label, setLabel]           = useState("Last 7 days");

  function setPreset(id) {
    const preset = PRESETS.find((p) => p.id === id);
    setPresetId(id);
    setRange(computePreset(id));
    setLabel(preset?.label ?? id);
  }

  function setCustomRange(start, end) {
    setPresetId("custom");
    setRange({ start, end });
    setLabel(`${formatDateShort(start)} – ${formatDateShort(end)}`);
  }

  return (
    <DateRangeContext.Provider
      value={{ ...range, presetId, label, setPreset, setCustomRange }}
    >
      {children}
    </DateRangeContext.Provider>
  );
}
