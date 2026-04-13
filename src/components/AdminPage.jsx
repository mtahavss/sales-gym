import "./dashboard/dashboard.css";

export default function AdminPage({ profile }) {
  return (
    <main className="app-shell admin-console-page">
      <div className="admin-page">
        <section className="db-panel admin-console-panel">
          <h1 className="admin-console-title">Admin Console</h1>
          <p className="admin-console-lead">Only admins can access this page.</p>
          <div className="admin-console-details">
            <p>
              <span className="admin-console-label">Signed in as</span>{" "}
              <strong>{profile?.email}</strong>
            </p>
            <p>
              <span className="admin-console-label">Current role</span>{" "}
              <strong>{profile?.role}</strong>
            </p>
          </div>
          <p className="admin-console-note">
            Role assignment is controlled in the Supabase <code>profiles</code> table. Set{" "}
            <code>role</code> to <code>admin</code>, <code>editor</code>, or <code>viewer</code>.
          </p>
        </section>
      </div>
    </main>
  );
}
