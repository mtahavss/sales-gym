/** Latest session timestamp in a list (ISO string). */
export function maxSessionCreatedAt(sessions) {
  let max = null;
  for (const s of sessions || []) {
    const t = s?.created_at;
    if (t && (!max || t > max)) max = t;
  }
  return max;
}

/**
 * Stat values for dashboard overview widgets (same formulas as DashboardHome).
 * @param {Array<{ created_at?: string }>} filteredSessions
 * @param {{ aiProspectCount?: number }} [options] — `aiProspectCount`: prospects created in range (AI Roleplay section).
 */
export function computeOverviewStatValues(filteredSessions, options = {}) {
  const { aiProspectCount } = options;
  const totalCalls = filteredSessions.length;
  const avgCallScore = totalCalls ? 74 : 0;
  const minutes = totalCalls * 18;
  const aiRoleplays = typeof aiProspectCount === "number" ? aiProspectCount : 0;
  const avgDurationMins = totalCalls ? (minutes / totalCalls).toFixed(1) : "0.0";
  return {
    totalCalls,
    avgCallScore,
    minutes,
    trainingTimeDisplay: `${minutes}m`,
    aiRoleplays,
    avgDurationMins,
  };
}
