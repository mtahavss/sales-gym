/**
 * Stat values for dashboard overview widgets (same formulas as DashboardHome).
 * @param {Array<{ created_at?: string }>} filteredSessions
 */
export function computeOverviewStatValues(filteredSessions) {
  const totalCalls = filteredSessions.length;
  const avgCallScore = totalCalls ? 74 : 0;
  const minutes = totalCalls * 18;
  const aiRoleplays = Math.max(0, totalCalls - 1);
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
