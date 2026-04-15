import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import {
  aggregateCallStatsByUserId,
  fetchTrainingSessionsForUserIds,
  TRAINING_SESSIONS_CHANGED_EVENT,
} from "../../lib/trainingSessions";
import { hasPermission } from "../../lib/rbac";
import {
  formatLastSeenRelative,
  isUserOnline,
} from "../../lib/userPresence";
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
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [teamLoadError, setTeamLoadError] = useState("");
  /** @type {Record<string, { totalCalls: number, lastCallAt: string | null }>} */
  const [callStatsByUserId, setCallStatsByUserId] = useState({});
  /** Selected member ids (for bulk actions). */
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const selectAllRef = useRef(null);
  const navigate = useNavigate();

  const isAdmin = hasPermission(profile?.role, "access_admin");
  const tableColCount = (isAdmin ? 7 : 6) + 1;

  const loadMembers = useCallback(async () => {
    if (!supabase) {
      setMembers(profile ? [profile] : []);
      setLoading(false);
      return;
    }
    setLoading(true);
    setTeamLoadError("");
    const selectFields = isAdmin
      ? "id, email, full_name, role, created_at, last_seen_at"
      : "id, email, full_name, role, created_at";
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(selectFields)
        .order("created_at", { ascending: true });
      if (error) {
        throw error;
      }
      setMembers(data?.length ? data : profile ? [profile] : []);
    } catch (e) {
      const msg = e?.message || "Could not load team members.";
      setTeamLoadError(msg);
      setMembers(profile ? [profile] : []);
    } finally {
      setLoading(false);
    }
  }, [profile, isAdmin]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const loadCallStats = useCallback(async () => {
    if (!supabase || members.length === 0) {
      setCallStatsByUserId({});
      return;
    }
    try {
      const ids = members.map((m) => m.id);
      const rows = await fetchTrainingSessionsForUserIds(ids);
      setCallStatsByUserId(aggregateCallStatsByUserId(rows));
    } catch {
      setCallStatsByUserId({});
    }
  }, [members]);

  useEffect(() => {
    loadCallStats();
  }, [loadCallStats]);

  useEffect(() => {
    function onSessionsChanged() {
      loadCallStats();
    }
    window.addEventListener(TRAINING_SESSIONS_CHANGED_EVENT, onSessionsChanged);
    return () => window.removeEventListener(TRAINING_SESSIONS_CHANGED_EVENT, onSessionsChanged);
  }, [loadCallStats]);

  useEffect(() => {
    const id = window.setInterval(() => {
      loadCallStats();
    }, 60_000);
    return () => window.clearInterval(id);
  }, [loadCallStats]);

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!isAdmin || !supabase) {
      return undefined;
    }
    const id = setInterval(() => {
      loadMembers();
    }, 45_000);
    return () => clearInterval(id);
  }, [isAdmin, loadMembers]);

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
      list.sort((a, b) => {
        const ca = callStatsByUserId[a.id]?.totalCalls ?? 0;
        const cb = callStatsByUserId[b.id]?.totalCalls ?? 0;
        if (cb !== ca) return cb - ca;
        const la = callStatsByUserId[a.id]?.lastCallAt || "";
        const lb = callStatsByUserId[b.id]?.lastCallAt || "";
        if (lb !== la) return lb.localeCompare(la);
        return (a.full_name || a.email || "").localeCompare(b.full_name || b.email || "");
      });
    }
    return list;
  }, [filtered, sortOrder, rankBy, callStatsByUserId]);

  const visibleMemberIds = useMemo(() => displayMembers.map((m) => m.id), [displayMembers]);

  useEffect(() => {
    const allowed = new Set(displayMembers.map((m) => m.id));
    setSelectedIds((prev) => {
      const next = new Set([...prev].filter((id) => allowed.has(id)));
      if (next.size === prev.size && [...prev].every((id) => next.has(id))) return prev;
      return next;
    });
  }, [displayMembers]);

  const selectedOnPageCount = useMemo(
    () => visibleMemberIds.filter((id) => selectedIds.has(id)).length,
    [visibleMemberIds, selectedIds]
  );
  const allVisibleSelected =
    visibleMemberIds.length > 0 && selectedOnPageCount === visibleMemberIds.length;
  const someVisibleSelected = selectedOnPageCount > 0 && !allVisibleSelected;

  useEffect(() => {
    const el = selectAllRef.current;
    if (el) {
      el.indeterminate = someVisibleSelected;
    }
  }, [someVisibleSelected]);

  function toggleSelected(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllVisible() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        visibleMemberIds.forEach((id) => next.delete(id));
      } else {
        visibleMemberIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

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

      {teamLoadError ? (
        <div className="tm-team-error" role="alert">
          {teamLoadError}
        </div>
      ) : null}

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
              onClick={() => {
                loadMembers();
                loadCallStats();
              }}
            >
              <RefreshIcon />
              Refresh
            </button>
          </div>
        </div>

        {selectedIds.size > 0 ? (
          <div className="tm-bulk-bar" role="status">
            <span className="tm-bulk-count">
              {selectedIds.size} member{selectedIds.size === 1 ? "" : "s"} selected
            </span>
            <div className="tm-bulk-actions">
              <button type="button" className="tm-bulk-clear-btn" onClick={clearSelection}>
                Clear selection
              </button>
            </div>
          </div>
        ) : null}

        {/* table */}
        <div className="tm-table-wrap">
          <table className="tm-table">
            <thead>
              <tr>
                <th className="tm-select-col">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    className="tm-row-select"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAllVisible}
                    disabled={loading || visibleMemberIds.length === 0}
                    title="Select all members in this list"
                    aria-label="Select all members in this list"
                  />
                </th>
                <th>Member</th>
                <th>Avg Score Trend</th>
                <th>Close Rate</th>
                <th>Last Call</th>
                <th title="When this member&apos;s account was created in your workspace.">Onboarding Date</th>
                {isAdmin ? (
                  <th title="Who currently has the app open (heartbeat). Admins only.">Session</th>
                ) : null}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={tableColCount} className="tm-empty-cell db-loading-cell">
                    <ThemeSpinner size="md" label="Loading team" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={tableColCount} className="tm-empty-cell">No members found.</td>
                </tr>
              ) : (
                displayMembers.map((m) => {
                  const initials = getInitials(m.full_name || m.email || "U");
                  const isSelf = m.id === user?.id;
                  const lastCallAt = callStatsByUserId[m.id]?.lastCallAt;
                  return (
                    <tr
                      key={m.id}
                      className={`tm-row-clickable${isSelf ? " tm-row-self" : ""}`}
                      onClick={() => navigate(`/dashboard/team/${m.id}`)}
                    >
                      <td
                        className="tm-select-cell"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          className="tm-row-select"
                          checked={selectedIds.has(m.id)}
                          onChange={() => toggleSelected(m.id)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Select ${m.full_name || m.email || "member"}`}
                        />
                      </td>
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
                      <td>
                        {lastCallAt ? (
                          <time
                            className="tm-onboard-date-only"
                            dateTime={lastCallAt}
                            title={new Date(lastCallAt).toLocaleString()}
                          >
                            {formatDate(lastCallAt)}
                          </time>
                        ) : (
                          <span className="tm-muted">—</span>
                        )}
                      </td>
                      <td>
                        <time
                          className="tm-onboard-date-only"
                          dateTime={m.created_at || undefined}
                          title="Profile created — when this member joined"
                        >
                          {formatDate(m.created_at)}
                        </time>
                      </td>
                      {isAdmin ? (
                        <td>
                          {isUserOnline(m.last_seen_at, nowMs) ? (
                            <span className="tm-session-badge tm-session-online">
                              <span className="tm-session-dot" aria-hidden="true" />
                              Online
                            </span>
                          ) : m.last_seen_at ? (
                            <span
                              className="tm-session-badge tm-session-away"
                              title={new Date(m.last_seen_at).toLocaleString()}
                            >
                              Away · {formatLastSeenRelative(m.last_seen_at, nowMs)}
                            </span>
                          ) : (
                            <span className="tm-muted">—</span>
                          )}
                        </td>
                      ) : null}
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
    </>
  );
}
