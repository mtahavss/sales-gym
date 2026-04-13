export default function DashboardOverview() {
  return (
    <section className="db-overview-grid">
      <article className="db-panel db-performance-panel">
        <h3>Performance Overview</h3>
        <p>Call scores and call minutes</p>
        <div className="db-chart-placeholder">
          <span>Tue</span>
          <span>Fri</span>
          <span>Sat</span>
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
        </div>
      </article>

      <article className="db-panel db-pulse-panel">
        <h3>Training Pulse</h3>
        <div className="db-pulse-empty">No call data yet</div>
      </article>
    </section>
  );
}
