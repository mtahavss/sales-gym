import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import DashboardPageHero from "./DashboardPageHero";
import ThemeSpinner from "../ThemeSpinner";
import ThemedMenuSelect from "./ThemedMenuSelect";

/* ── Icons ────────────────────────────────────────────────── */
function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <circle cx="8.5" cy="8.5" r="5.5" />
      <path d="M15 15l-2.5-2.5" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <path d="M3.5 9.5A6.5 6.5 0 0 1 14 5.5M16.5 10.5A6.5 6.5 0 0 1 6 14.5M14 5.5V2M14 5.5h-3M6 14.5v3M6 14.5h3" />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <path d="M7 3H3a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V9M10 2h4m0 0v4m0-4L7 9" />
    </svg>
  );
}

/* ── Helpers ──────────────────────────────────────────────── */
function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const ROLE_LABELS = { admin: "Admin", editor: "Editor", viewer: "Member" };

const ROLE_FILTER_OPTIONS = [
  { value: "all", label: "All roles" },
  { value: "admin", label: "Admin" },
  { value: "editor", label: "Editor" },
  { value: "viewer", label: "Member" },
];

const SORT_OPTIONS = [
  { value: "top", label: "Top first (recommended)" },
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
];

const RANK_OPTIONS = [
  { value: "score", label: "Score rank" },
  { value: "calls", label: "Call count" },
];

/* ── Component ────────────────────────────────────────────── */
export default function DashboardTeam({ user, profile }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("top");
  const [rankBy, setRankBy] = useState("score");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadMembers() {
      if (!supabase) {
        setMembers(profile ? [profile] : []);
        setLoading(false);
        return;
      }
      try {
        const { data } = await supabase
          .from("profiles")
          .select("id, email, full_name, role, created_at")
          .order("created_at", { ascending: true });
        setMembers(data || (profile ? [profile] : []));
      } catch {
        setMembers(profile ? [profile] : []);
      } finally {
        setLoading(false);
      }
    }
    loadMembers();
  }, [profile]);

  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      (m.full_name || "").toLowerCase().includes(q) ||
      (m.email || "").toLowerCase().includes(q);
    const matchRole = roleFilter === "all" || m.role === roleFilter;
    return matchSearch && matchRole;
  });

  const displayMembers = useMemo(() => {
    const list = [...filtered];
    if (sortOrder === "newest") {
      list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    } else if (sortOrder === "oldest") {
      list.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
    }
    if (rankBy === "calls") {
      /* Placeholder until call metrics exist — keep stable order */
    }
    return list;
  }, [filtered, sortOrder, rankBy]);

  const isAdmin = profile?.role === "admin";

  return (
    <>
      <DashboardPageHero
        eyebrow="Manage"
        title="Team"
        subtitle="Invite members, assign roles, and keep your workspace seats organized."
        helpLink={{
          href: "#",
          label: "Team & roles · View docs",
          onClick: (e) => e.preventDefault(),
        }}
        primaryButton={
          isAdmin
            ? {
                label: "+ Add Member",
                onClick: () => {
                  /* invite flow — coming soon */
                },
              }
            : undefined
        }
        variant="team"
      />

      {/* ── Members table ── */}
      <div className="db-panel tm-panel">
        {/* toolbar */}
        <div className="tm-toolbar">
          <div className="tm-search-wrap">
            <SearchIcon />
            <input
              className="tm-search-input"
              type="text"
              placeholder="Search members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="tm-filters">
            <ThemedMenuSelect
              className="tm-menu-select--roles"
              value={roleFilter}
              onChange={setRoleFilter}
              options={ROLE_FILTER_OPTIONS}
            />
            <ThemedMenuSelect
              className="tm-menu-select--sort"
              value={sortOrder}
              onChange={setSortOrder}
              options={SORT_OPTIONS}
            />
            <ThemedMenuSelect
              className="tm-menu-select--rank"
              value={rankBy}
              onChange={setRankBy}
              options={RANK_OPTIONS}
            />
          </div>

          <div className="tm-seats-row">
            <span className="tm-seats-label">{members.length} of {members.length} seats used</span>
            <button
              type="button"
              className="tm-icon-btn"
              title="Refresh"
              onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 600); }}
            >
              <RefreshIcon />
              Refresh
            </button>
          </div>
        </div>

        {/* table */}
        <div className="tm-table-wrap">
          <table className="tm-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Avg Score Trend</th>
                <th>Close Rate</th>
                <th>Last Call</th>
                <th>Onboarding</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="tm-empty-cell db-loading-cell">
                    <ThemeSpinner size="md" label="Loading team" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="tm-empty-cell">No members found.</td>
                </tr>
              ) : (
                displayMembers.map((m) => {
                  const initials = getInitials(m.full_name || m.email || "U");
                  const isSelf = m.id === user?.id;
                  return (
                    <tr
                      key={m.id}
                      className={`tm-row-clickable${isSelf ? " tm-row-self" : ""}`}
                      onClick={() => navigate(`/dashboard/team/${m.id}`)}
                    >
                      <td>
                        <div className="tm-member-cell">
                          <span className="tm-avatar">{initials || "U"}</span>
                          <div className="tm-member-info">
                            <span className="tm-member-name">
                              {m.full_name || m.email?.split("@")[0] || "User"}
                              {isSelf && <span className="tm-you-tag">you</span>}
                            </span>
                            <span className="tm-member-email">{m.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="tm-muted">—</td>
                      <td className="tm-muted">0%</td>
                      <td className="tm-muted">—</td>
                      <td>
                        <span className="tm-onboard-label">
                          Joined: {formatDate(m.created_at)}
                        </span>
                      </td>
                      <td>
                        <span className="tm-status-badge tm-status-active">Active</span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="tm-manage-btn"
                          onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/team/${m.id}`); }}
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Settings section ── */}
      <div className="tm-section-label">Settings</div>

      <div className="db-panel tm-settings-panel">
        <div className="tm-settings-row">
          <div>
            <p className="tm-settings-title">Seat Management</p>
            <p className="tm-settings-desc">Open Stripe to manage your seat count and billing for this team.</p>
          </div>
          <button type="button" className="tm-stripe-btn">
            Manage Seats <ExternalIcon />
          </button>
        </div>
      </div>

      {/* ── Danger zone ── */}
      <div className="db-panel tm-danger-panel">
        <div className="tm-settings-row">
          <div>
            <p className="tm-danger-title">Delete Team</p>
            <p className="tm-settings-desc">
              Permanently deletes this team and <strong>all</strong> of its data. This action cannot be undone.
            </p>
          </div>
          {showDeleteConfirm ? (
            <div className="tm-confirm-row">
              <span className="tm-confirm-label">Are you sure?</span>
              <button type="button" className="tm-cancel-btn" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button type="button" className="tm-delete-confirm-btn">
                Yes, Delete
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="tm-delete-btn"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </>
  );
}
