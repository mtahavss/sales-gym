import "./ThemeSpinner.css";

/** Annulus sector in SVG coords (0° = right, angles in degrees, CCW). */
function segmentPath(cx, cy, rOuter, rInner, startDeg, endDeg) {
  const rad = (d) => ((d - 90) * Math.PI) / 180;
  const cos = Math.cos;
  const sin = Math.sin;
  const x1 = cx + rOuter * cos(rad(startDeg));
  const y1 = cy + rOuter * sin(rad(startDeg));
  const x2 = cx + rOuter * cos(rad(endDeg));
  const y2 = cy + rOuter * sin(rad(endDeg));
  const x3 = cx + rInner * cos(rad(endDeg));
  const y3 = cy + rInner * sin(rad(endDeg));
  const x4 = cx + rInner * cos(rad(startDeg));
  const y4 = cy + rInner * sin(rad(startDeg));
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${rOuter} ${rOuter} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${rInner} ${rInner} 0 ${large} 0 ${x4} ${y4} Z`;
}

const SEGMENT_COLORS = [
  "var(--theme-spinner-c0)",
  "var(--theme-spinner-c1)",
  "var(--theme-spinner-c2)",
  "var(--theme-spinner-c3)",
  "var(--theme-spinner-c4)",
  "var(--theme-spinner-c5)",
  "var(--theme-spinner-c6)",
  "var(--theme-spinner-c7)",
];

const SIZES = new Set(["sm", "md", "lg"]);

/**
 * Segmented ring loader (orange/peach theme). Rotates continuously.
 */
export default function ThemeSpinner({ className = "", size = "md", label = "Loading" }) {
  const sizeKey = SIZES.has(size) ? size : "md";
  const cx = 24;
  const cy = 24;
  const rOuter = 20;
  const rInner = 12.5;
  const gap = 2.5;
  const seg = 360 / 8;

  const paths = [];
  for (let i = 0; i < 8; i += 1) {
    const start = i * seg + gap;
    const end = (i + 1) * seg - gap;
    paths.push(
      <path
        key={i}
        d={segmentPath(cx, cy, rOuter, rInner, start, end)}
        fill={SEGMENT_COLORS[i]}
      />,
    );
  }

  return (
    <div
      className={`theme-spinner theme-spinner--${sizeKey} ${className}`.trim()}
      role="status"
      aria-busy="true"
      aria-label={label}
    >
      <svg className="theme-spinner__svg" viewBox="0 0 48 48" aria-hidden focusable="false">
        {paths}
      </svg>
    </div>
  );
}
