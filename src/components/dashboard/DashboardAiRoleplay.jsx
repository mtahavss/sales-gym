import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./DashboardAiRoleplay.css";
import DashboardPageHero from "./DashboardPageHero";
import CreateAiProspectModal from "./CreateAiProspectModal";
import DeleteProspectConfirmModal from "./DeleteProspectConfirmModal";
import SelectTrainingModeModal from "./SelectTrainingModeModal";
import ThemedMenuSelect from "./ThemedMenuSelect";
import {
  createAiProspect,
  deleteAiProspect,
  listAiProspects,
  updateAiProspect,
} from "../../lib/aiProspects";
import {
  PROSPECT_INDUSTRY_FILTER_OPTIONS,
  labelForIndustryValue,
  prospectMatchesIndustryLabel,
} from "../../lib/prospectIndustryOptions";
import { isSupabaseConfigured, missingSupabaseMessage } from "../../lib/supabaseClient";

const AR_LANGUAGE_OPTIONS = [
  { value: "all", label: "All languages" },
  { value: "en", label: "English" },
];

const AR_SORT_OPTIONS = [
  { value: "name", label: "Sort: Name" },
  { value: "recent", label: "Sort: Recent" },
];

function BuildingIcon({ className }) {
  return (
    <svg className={className || "db-ar-section-icon"} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M4 21h16V8l-8-5-8 5v13zm2-2V9.5l6-3.75 6 3.75V19H6zm4-6h2v5h-2v-5zm4 0h2v5h-2v-5z" />
    </svg>
  );
}

function LayersIcon({ className }) {
  return (
    <svg className={className || "db-ar-section-icon"} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M12.53 2.25h-.06a.75.75 0 0 0-.37.1L3 6.5v.01a.75.75 0 0 0 0 1.37L12 12.01l9-4.13a.75.75 0 0 0 0-1.37L12.53 2.35a.75.75 0 0 0-.37-.1zM3 11.26a.75.75 0 0 0-.47 1.35L12 17l9.47-4.39a.75.75 0 1 0-.63-1.36L12 14.74l-8.84-4.09a.75.75 0 0 0-.16-.39zM3 15.75a.75.75 0 0 0-.47 1.35L12 21.5l9.47-4.4a.75.75 0 1 0-.63-1.35L12 19.24l-8.84-4.09a.75.75 0 0 0-.16-.4z" />
    </svg>
  );
}

function HouseIcon({ className }) {
  return (
    <svg className={className || "db-ar-section-icon"} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3zm0 2.8l6 5.4V18h-2v-6H8v6H6v-6.8l6-5.4z" />
    </svg>
  );
}

function ChevronIcon({ open }) {
  return (
    <svg
      className={`db-ar-group-chevron${open ? " db-ar-group-chevron--open" : ""}`}
      viewBox="0 0 24 24"
      width="20"
      height="20"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="19" r="2.5" />
      <path d="m8.6 13.5 6.8 3.5M15.4 6.5 8.6 10" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">
      <circle cx="12" cy="6" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="12" cy="18" r="1.6" />
    </svg>
  );
}

function MenuPencilIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function MenuTrashIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function SessionInfoIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  );
}

function getInitials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function firstConversationLabel(conversationTypes) {
  const first = String(conversationTypes || "")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)[0];
  return first || "Practice call";
}

/** Card view model from wizard payload or stored `form_data`. */
function prospectDisplayFromFormData(data, { id, sessionCount = 0, createdAt } = {}) {
  const typeTag = data.prospectType === "b2c" ? "B2C" : "B2B";
  const tags = [firstConversationLabel(data.conversationTypes), typeTag];
  const role =
    typeTag === "B2C"
      ? [data.job, data.b2cMonthlyIncome || data.companySize].filter(Boolean).join(" · ") ||
        data.job ||
        "Prospect"
      : [data.job, data.industry].filter(Boolean).join(" @ ") || data.job || "Prospect";
  const trainingLine =
    (data.trainingGoals || "").trim() ||
    (data.expectedChallenges || "").trim() ||
    "Practice scenario";
  const caps = trainingLine.toUpperCase();
  const objectiveCaps = caps.length > 32 ? `${caps.slice(0, 30)}…` : caps;
  const genId =
    id ??
    (typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `p-${Date.now()}`);

  return {
    id: genId,
    name: data.fullName?.trim() || "Untitled prospect",
    role,
    industry: data.industry || "",
    tags,
    objectiveCaps,
    description: data.description?.trim() || "",
    accent: typeTag,
    sessions: sessionCount,
    initials: getInitials(data.fullName),
    createdAt: createdAt || null,
  };
}

function prospectFromDbRow(row) {
  const fd = row?.form_data && typeof row.form_data === "object" ? row.form_data : {};
  return prospectDisplayFromFormData(fd, {
    id: row.id,
    sessionCount: row.session_count ?? 0,
    createdAt: row.created_at,
  });
}

function industryGroupKey(p) {
  const ind = String(p.industry || "").trim();
  return ind || "General";
}

function sectionIconForGroup(groupName) {
  const n = groupName.toLowerCase();
  if (/real\s*estate|property|housing|realtor/.test(n)) {
    return "house";
  }
  if (/saas|software|cloud|tech|it\b/.test(n)) {
    return "layers";
  }
  return "building";
}

function groupIconClass(groupName) {
  const kind = sectionIconForGroup(groupName);
  if (kind === "house") return "db-ar-group-icon-wrap db-ar-group-icon-wrap--green";
  if (kind === "layers") return "db-ar-group-icon-wrap db-ar-group-icon-wrap--violet";
  return "db-ar-group-icon-wrap db-ar-group-icon-wrap--slate";
}

function groupIdSlug(name) {
  return encodeURIComponent(name).replace(/%/g, "_");
}

function conversationTagForCard(p) {
  const t = p.tags.find((x) => x !== "B2B" && x !== "B2C");
  return t || p.tags[0] || "Practice call";
}

function buildIndustryGroups(list) {
  const map = new Map();
  for (const p of list) {
    const key = industryGroupKey(p);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(p);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b, undefined, { sensitivity: "base" }))
    .map(([name, items]) => ({ name, items }));
}

function groupCompositeKey(segment, industryName) {
  return `${segment}:${industryName}`;
}

function ProspectCard({ p, dbRow, menuOpen, onToggleMenu, onEdit, onDelete, deleteBusy, onOpenTrainingMode }) {
  const callType = conversationTagForCard(p);
  const canManage = Boolean(dbRow);
  return (
    <li className={`db-ar-card${menuOpen ? " db-ar-card--menu-open" : ""}`}>
      <div className="db-ar-card-banner">
        <div className="db-ar-card-banner-media" aria-hidden="true">
          <div className="db-ar-card-banner-art" />
          <div className="db-ar-card-banner-pattern" />
        </div>
        <div className="db-ar-card-tags db-ar-card-tags--banner">
          <span
            className={`db-ar-card-tag db-ar-card-tag--type${p.accent === "B2C" ? " db-ar-card-tag--b2c" : ""}`}
          >
            {p.accent}
          </span>
        </div>
        <div className="db-ar-card-actions">
          <button type="button" className="db-ar-card-icon-btn" aria-label="Share prospect">
            <ShareIcon />
          </button>
          <div className="db-ar-card-more-wrap" data-ar-prospect-menu={p.id}>
            <button
              type="button"
              className={`db-ar-card-icon-btn${menuOpen ? " is-active" : ""}`}
              aria-label="More options"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              disabled={!canManage}
              onClick={(e) => {
                e.stopPropagation();
                if (canManage) onToggleMenu();
              }}
            >
              <MoreIcon />
            </button>
            {menuOpen && canManage ? (
              <div className="db-ar-card-dropdown" role="menu">
                <button
                  type="button"
                  className="db-ar-card-dropdown-item"
                  role="menuitem"
                  onClick={() => onEdit(dbRow)}
                >
                  <span className="db-ar-card-dropdown-item__icon" aria-hidden="true">
                    <MenuPencilIcon />
                  </span>
                  <span className="db-ar-card-dropdown-item__label">Edit</span>
                </button>
                <div className="db-ar-card-dropdown-divider" aria-hidden="true" />
                <button
                  type="button"
                  className="db-ar-card-dropdown-item db-ar-card-dropdown-item--danger"
                  role="menuitem"
                  disabled={deleteBusy}
                  onClick={() => onDelete(dbRow)}
                >
                  <span className="db-ar-card-dropdown-item__icon" aria-hidden="true">
                    <MenuTrashIcon />
                  </span>
                  <span className="db-ar-card-dropdown-item__label">Delete</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>
        <div className="db-ar-card-photo" aria-hidden="true">
          {p.initials ?? getInitials(p.name)}
        </div>
      </div>
      <div className="db-ar-card-body">
        <h3 className="db-ar-card-name">{p.name}</h3>
        <p className="db-ar-card-role">{p.role}</p>
        <span className="db-ar-card-call-pill">{callType}</span>
        <p className="db-ar-card-desc">{p.description}</p>
        <div className="db-ar-card-footer">
          <span className="db-ar-card-footline">{p.objectiveCaps}</span>
          <span className="db-ar-card-accent">{p.accent}</span>
        </div>
        <div className="db-ar-card-sessions-row">
          <span className="db-ar-card-sessions-label">
            SESSIONS <SessionInfoIcon />
          </span>
          <span className="db-ar-card-sessions-count">{p.sessions ?? 0}</span>
        </div>
        <button
          type="button"
          className="db-ar-start-btn"
          onClick={() => onOpenTrainingMode?.(p, dbRow)}
        >
          <PlayIcon />
          Start Session
        </button>
      </div>
    </li>
  );
}

/** @param {{ user: { id: string } | null | undefined }} props */
export default function DashboardAiRoleplay({ user }) {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loadState, setLoadState] = useState("idle");
  const [loadError, setLoadError] = useState("");
  const [createProspectOpen, setCreateProspectOpen] = useState(false);
  const [editProspectRow, setEditProspectRow] = useState(null);
  const [cardMenuId, setCardMenuId] = useState(null);
  const [deleteBusyId, setDeleteBusyId] = useState(null);
  const [deleteConfirmRow, setDeleteConfirmRow] = useState(null);
  const [trainingModeModal, setTrainingModeModal] = useState(null);
  const [search, setSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [expandedGroups, setExpandedGroups] = useState({});

  const refreshProspects = useCallback(async () => {
    if (!user?.id || !isSupabaseConfigured) {
      setRows([]);
      setLoadState("ready");
      return;
    }
    setLoadState("loading");
    setLoadError("");
    try {
      const list = await listAiProspects(user.id);
      setRows(list);
      setLoadState("ready");
    } catch (e) {
      setLoadError(e?.message || "Could not load prospects.");
      setRows([]);
      setLoadState("error");
    }
  }, [user?.id]);

  useEffect(() => {
    refreshProspects();
  }, [refreshProspects]);

  useEffect(() => {
    if (!cardMenuId) return;
    function onDocMouseDown(e) {
      const el = e.target;
      if (!(el instanceof Element)) return;
      if (el.closest(`[data-ar-prospect-menu="${cardMenuId}"]`)) return;
      setCardMenuId(null);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [cardMenuId]);

  const prospects = useMemo(() => rows.map(prospectFromDbRow), [rows]);

  function rowForProspectId(id) {
    return rows.find((r) => r.id === id) ?? null;
  }

  function requestDeleteProspect(row) {
    if (!user?.id) {
      window.alert("You must be signed in to delete a prospect.");
      return;
    }
    if (!isSupabaseConfigured) {
      window.alert(missingSupabaseMessage);
      return;
    }
    setDeleteConfirmRow(row);
    setCardMenuId(null);
  }

  async function executeDeleteConfirmed() {
    const row = deleteConfirmRow;
    if (!row?.id || !user?.id) return;
    setDeleteBusyId(row.id);
    try {
      await deleteAiProspect({ id: row.id, userId: user.id });
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      setDeleteConfirmRow(null);
    } catch (e) {
      window.alert(e?.message || "Could not delete prospect.");
    } finally {
      setDeleteBusyId(null);
    }
  }

  function handleEditProspect(row) {
    setCreateProspectOpen(false);
    setEditProspectRow(row);
    setCardMenuId(null);
  }

  /** Opens live training UI; `payload` is passed as `location.state` for the AI bot integration. */
  function handleTrainingSessionStart(payload) {
    navigate("/call-session", { state: payload });
  }

  const displayed = useMemo(() => {
    let list = prospects;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.role.toLowerCase().includes(q) ||
          (p.industry && p.industry.toLowerCase().includes(q)) ||
          p.objectiveCaps.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q),
      );
    }
    if (industryFilter !== "all") {
      const label = labelForIndustryValue(industryFilter);
      if (label) {
        list = list.filter((p) => prospectMatchesIndustryLabel(p, label));
      }
    }
    if (languageFilter === "en") {
      list = list.filter((p) => {
        const fd = rows.find((r) => r.id === p.id)?.form_data;
        const voice = fd && typeof fd.voice === "string" ? fd.voice.toLowerCase() : "";
        return /english/i.test(voice) || voice === "";
      });
    }
    if (sortBy === "name") {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
    } else {
      list = [...list].sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta;
      });
    }
    return list;
  }, [prospects, rows, search, industryFilter, languageFilter, sortBy]);

  const total = prospects.length;
  const shown = displayed.length;

  const b2bList = useMemo(() => displayed.filter((p) => p.accent === "B2B"), [displayed]);
  const b2cList = useMemo(() => displayed.filter((p) => p.accent === "B2C"), [displayed]);

  const b2bGroups = useMemo(() => buildIndustryGroups(b2bList), [b2bList]);
  const b2cGroups = useMemo(() => buildIndustryGroups(b2cList), [b2cList]);

  function toggleGroup(segment, industryName) {
    const comp = groupCompositeKey(segment, industryName);
    setExpandedGroups((prev) => {
      const isOpen = prev[comp] !== false;
      return { ...prev, [comp]: !isOpen };
    });
  }

  function isGroupOpen(segment, industryName) {
    return expandedGroups[groupCompositeKey(segment, industryName)] !== false;
  }

  const configBanner = !isSupabaseConfigured ? (
    <p className="db-ar-config-banner" role="status">
      {missingSupabaseMessage} Prospects will not sync until Supabase is configured.
    </p>
  ) : null;

  return (
    <div className="db-ar-root">
      {configBanner}

      <DashboardPageHero
        eyebrow="Overview"
        title="AI Roleplay"
        subtitle="Practice your sales pitch with realistic AI prospect scenarios."
        helpLink={{
          href: "#",
          label: "Need help with roleplay? View docs",
          onClick: (e) => e.preventDefault(),
        }}
        primaryButton={{
          label: "Create New Prospect",
          trailingPlus: true,
          onClick: () => {
            setEditProspectRow(null);
            setCreateProspectOpen(true);
          },
          disabled: !isSupabaseConfigured || !user?.id,
        }}
        variant="roleplay"
      />

      <section className="db-ar-filters-panel" aria-label="Filter prospects">
        <input
          type="search"
          className="db-ar-filter-search"
          placeholder="Search by name, role, industry, or training objective"
          aria-label="Search prospects"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="db-ar-filter-row">
          <ThemedMenuSelect
            value={industryFilter}
            onChange={setIndustryFilter}
            options={PROSPECT_INDUSTRY_FILTER_OPTIONS}
            ariaLabel="Industry"
          />
          <ThemedMenuSelect
            value={languageFilter}
            onChange={setLanguageFilter}
            options={AR_LANGUAGE_OPTIONS}
            ariaLabel="Language"
          />
          <ThemedMenuSelect
            value={sortBy}
            onChange={setSortBy}
            options={AR_SORT_OPTIONS}
            ariaLabel="Sort prospects"
          />
        </div>
        <p className="db-ar-count">
          {loadState === "loading"
            ? "Loading prospects…"
            : `Showing ${shown} of ${total} prospect${total === 1 ? "" : "s"}`}
        </p>
        {loadError ? (
          <p className="db-ar-load-error" role="alert">
            {loadError}{" "}
            <button type="button" className="db-ar-retry-btn" onClick={() => refreshProspects()}>
              Retry
            </button>
          </p>
        ) : null}
      </section>

      <div className="db-ar-prospects" aria-label="Prospects by roleplay type">
        {loadState === "ready" && shown === 0 ? (
          <p className="db-ar-empty">
            {total === 0
              ? "No prospects yet. Create one to save it to your account."
              : "No prospects match your filters."}
          </p>
        ) : null}

        {b2bList.length > 0 ? (
          <section className="db-ar-segment db-ar-segment--b2b" aria-label="B2B roleplay prospects">
            <div className="db-ar-groups">
              {b2bGroups.map(({ name, items }) => {
                const open = isGroupOpen("b2b", name);
                const slug = groupIdSlug(name);
                const headId = `db-ar-ghead-b2b-${slug}`;
                const panelId = `db-ar-gpanel-b2b-${slug}`;
                const kind = sectionIconForGroup(name);
                return (
                  <div key={`b2b-${name}`} className="db-ar-group">
                    <button
                      type="button"
                      className="db-ar-group-header"
                      id={headId}
                      aria-expanded={open}
                      aria-controls={panelId}
                      onClick={() => toggleGroup("b2b", name)}
                    >
                      <div className="db-ar-group-header-main">
                        <span className={groupIconClass(name)} aria-hidden="true">
                          {kind === "house" ? (
                            <HouseIcon className="db-ar-group-icon-svg" />
                          ) : kind === "layers" ? (
                            <LayersIcon className="db-ar-group-icon-svg" />
                          ) : (
                            <BuildingIcon className="db-ar-group-icon-svg" />
                          )}
                        </span>
                        <div className="db-ar-group-titles">
                          <span className="db-ar-group-title">{name}</span>
                          <span className="db-ar-group-sub">
                            {items.length} prospect{items.length === 1 ? "" : "s"}
                          </span>
                        </div>
                      </div>
                      <div className="db-ar-group-header-aside">
                        <span className="db-ar-group-count-badge">{items.length}</span>
                        <span className="db-ar-group-chevron-wrap" aria-hidden="true">
                          <ChevronIcon open={open} />
                        </span>
                      </div>
                    </button>
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={headId}
                      className="db-ar-group-panel"
                      hidden={!open}
                    >
                      <ul className="db-ar-card-list">
                        {items.map((p) => (
                          <ProspectCard
                            key={p.id}
                            p={p}
                            dbRow={rowForProspectId(p.id)}
                            menuOpen={cardMenuId === p.id}
                            onToggleMenu={() =>
                              setCardMenuId((cur) => (cur === p.id ? null : p.id))
                            }
                            onEdit={handleEditProspect}
                            onDelete={requestDeleteProspect}
                            deleteBusy={deleteBusyId === p.id}
                            onOpenTrainingMode={(cardP, row) =>
                              setTrainingModeModal({ p: cardP, dbRow: row })
                            }
                          />
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {b2cList.length > 0 ? (
          <section className="db-ar-segment db-ar-segment--b2c" aria-label="B2C roleplay prospects">
            <div className="db-ar-groups">
              {b2cGroups.map(({ name, items }) => {
                const open = isGroupOpen("b2c", name);
                const slug = groupIdSlug(name);
                const headId = `db-ar-ghead-b2c-${slug}`;
                const panelId = `db-ar-gpanel-b2c-${slug}`;
                const kind = sectionIconForGroup(name);
                return (
                  <div key={`b2c-${name}`} className="db-ar-group">
                    <button
                      type="button"
                      className="db-ar-group-header"
                      id={headId}
                      aria-expanded={open}
                      aria-controls={panelId}
                      onClick={() => toggleGroup("b2c", name)}
                    >
                      <div className="db-ar-group-header-main">
                        <span className={groupIconClass(name)} aria-hidden="true">
                          {kind === "house" ? (
                            <HouseIcon className="db-ar-group-icon-svg" />
                          ) : kind === "layers" ? (
                            <LayersIcon className="db-ar-group-icon-svg" />
                          ) : (
                            <BuildingIcon className="db-ar-group-icon-svg" />
                          )}
                        </span>
                        <div className="db-ar-group-titles">
                          <span className="db-ar-group-title">{name}</span>
                          <span className="db-ar-group-sub">
                            {items.length} prospect{items.length === 1 ? "" : "s"}
                          </span>
                        </div>
                      </div>
                      <div className="db-ar-group-header-aside">
                        <span className="db-ar-group-count-badge">{items.length}</span>
                        <span className="db-ar-group-chevron-wrap" aria-hidden="true">
                          <ChevronIcon open={open} />
                        </span>
                      </div>
                    </button>
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={headId}
                      className="db-ar-group-panel"
                      hidden={!open}
                    >
                      <ul className="db-ar-card-list">
                        {items.map((p) => (
                          <ProspectCard
                            key={p.id}
                            p={p}
                            dbRow={rowForProspectId(p.id)}
                            menuOpen={cardMenuId === p.id}
                            onToggleMenu={() =>
                              setCardMenuId((cur) => (cur === p.id ? null : p.id))
                            }
                            onEdit={handleEditProspect}
                            onDelete={requestDeleteProspect}
                            deleteBusy={deleteBusyId === p.id}
                            onOpenTrainingMode={(cardP, row) =>
                              setTrainingModeModal({ p: cardP, dbRow: row })
                            }
                          />
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>

      {createProspectOpen || editProspectRow ? (
        <CreateAiProspectModal
          key={editProspectRow ? `edit-${editProspectRow.id}` : "create"}
          editRecord={editProspectRow || undefined}
          onClose={() => {
            setCreateProspectOpen(false);
            setEditProspectRow(null);
          }}
          onContinue={
            editProspectRow
              ? async (data) => {
                  if (!user?.id) {
                    throw new Error("You must be signed in to save a prospect.");
                  }
                  if (!isSupabaseConfigured) {
                    throw new Error(missingSupabaseMessage);
                  }
                  const updated = await updateAiProspect({
                    id: editProspectRow.id,
                    userId: user.id,
                    formData: data,
                  });
                  setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
                }
              : async (data) => {
                  if (!user?.id) {
                    throw new Error("You must be signed in to save a prospect.");
                  }
                  if (!isSupabaseConfigured) {
                    throw new Error(missingSupabaseMessage);
                  }
                  const row = await createAiProspect({ userId: user.id, formData: data });
                  setRows((prev) => [row, ...prev.filter((r) => r.id !== row.id)]);
                }
          }
        />
      ) : null}

      {deleteConfirmRow ? (
        <DeleteProspectConfirmModal
          prospectName={prospectFromDbRow(deleteConfirmRow).name}
          onCancel={() => {
            if (deleteBusyId) return;
            setDeleteConfirmRow(null);
          }}
          onConfirm={executeDeleteConfirmed}
          busy={deleteBusyId === deleteConfirmRow.id}
        />
      ) : null}

      {trainingModeModal?.p ? (
        <SelectTrainingModeModal
          prospect={trainingModeModal.p}
          dbRow={trainingModeModal.dbRow}
          onClose={() => setTrainingModeModal(null)}
          onStartSession={handleTrainingSessionStart}
        />
      ) : null}
    </div>
  );
}
