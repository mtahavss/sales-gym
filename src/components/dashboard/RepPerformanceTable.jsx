import ThemeSpinner from "../ThemeSpinner";

export default function RepPerformanceTable({ sessions, loading }) {
  return (
    <section className="db-panel db-rep-panel">
      <div className="db-rep-header">
        <h3>Rep Performance</h3>
        <p>
          Performance overview with call scores, red flags, and training progress for the selected
          period.
        </p>
      </div>

      <div className="db-rep-toolbar">
        <input type="text" placeholder="Search team members..." />
        <button type="button">All</button>
        <button type="button">Best to Worst</button>
      </div>

      <div className="db-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Representative</th>
              <th>Performance</th>
              <th>Flags</th>
              <th>Minutes</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="db-loading-cell">
                  <ThemeSpinner size="md" label="Loading rep performance" />
                </td>
              </tr>
            ) : sessions.length === 0 ? (
              <tr>
                <td colSpan={6}>No sessions yet</td>
              </tr>
            ) : (
              sessions.slice(0, 5).map((session, index) => (
                <tr key={session.id}>
                  <td>
                    <span className="db-rank-pill">{index + 1}</span>
                  </td>
                  <td>
                    <div className="db-rep-cell">
                      <span className="db-rep-avatar">
                        {String(session.closer_name || "R").charAt(0).toUpperCase()}
                      </span>
                      <span>{session.closer_name}</span>
                    </div>
                  </td>
                  <td>{index === 0 ? "Excellent" : "--"}</td>
                  <td>--</td>
                  <td>--</td>
                  <td>
                    <button type="button">View &gt;</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
