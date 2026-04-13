export default function DashboardStats({ stats }) {
  return (
    <section className="db-stats-grid">
      {stats.map((item) => (
        <article key={item.label} className="db-stat-card">
          <p className="db-stat-label">{item.label}</p>
          <p className="db-stat-value">{item.value}</p>
          <p className="db-stat-delta">{item.delta} vs last week</p>
        </article>
      ))}
    </section>
  );
}
