import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { hasPermission } from "../../lib/rbac";
import DashboardProfileDropdownMenu from "./DashboardProfileDropdownMenu";
import { useDateRange } from "../../lib/DateRangeContext";
import CalendarRangePicker from "./CalendarRangePicker";

// ── Icons ──────────────────────────────────────────────────────────────────────

function ThemeIcon({ type }) {
  if (type === "light") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4.2" />
        <path d="M12 2.5v2.3M12 19.2v2.3M4.8 4.8l1.6 1.6M17.6 17.6l1.6 1.6M2.5 12h2.3M19.2 12h2.3M4.8 19.2l1.6-1.6M17.6 6.4l1.6-1.6" />
      </svg>
    );
  }
  if (type === "dark") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 14.4A8.6 8.6 0 1 1 9.6 4a7 7 0 1 0 10.4 10.4Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="5" width="16" height="11" rx="2" />
      <path d="M10 19h4M8 21h8" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a5 5 0 0 0-5 5v2.5L5 15h14l-2-4.5V8a5 5 0 0 0-5-5Z" />
      <path d="M9 15a3 3 0 0 0 6 0" />
    </svg>
  );
}

function SearchGlassIcon() {
  return (
    <svg className="db-topbar-search-glass" viewBox="0 0 24 24" aria-hidden="true" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M16 16l4 4" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

// ── Date Range Picker (wraps the calendar) ────────────────────────────────────

function DateRangePicker() {
  const { label } = useDateRange();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    function onOutside(e) {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  return (
    <div className="db-daterange-wrap" ref={wrapRef}>
      <button
        type="button"
        className="db-date-chip"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Select date range"
      >
        <CalendarIcon />
        <span className="db-date-chip-text">{label}</span>
      </button>

      {open && (
        <div className="db-daterange-dropdown" role="dialog" aria-label="Date range picker">
          <CalendarRangePicker onClose={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}

// ── Notification Bell ──────────────────────────────────────────────────────────

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    function onOutside(e) {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  return (
    <div className="db-notif-wrap" ref={wrapRef}>
      <button
        type="button"
        className="db-topbar-icon-btn"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <BellIcon />
      </button>

      {open && (
        <div className="db-notif-dropdown" role="dialog" aria-label="Notifications">
          <div className="db-notif-header">
            <span className="db-notif-title">Notifications</span>
            <button type="button" className="db-notif-clear">Mark all read</button>
          </div>
          <div className="db-notif-empty">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3a5 5 0 0 0-5 5v2.5L5 15h14l-2-4.5V8a5 5 0 0 0-5-5Z" />
              <path d="M9 15a3 3 0 0 0 6 0" />
            </svg>
            <p>You&apos;re all caught up!</p>
            <span>No new notifications.</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Topbar ────────────────────────────────────────────────────────────────

export default function DashboardTopbar({
  themeMode,
  onThemeModeChange,
  user,
  profile,
  onSignOut,
  onMobileMenuOpen,
  profileMenuOpen = false,
  onProfileMenuToggle,
  onCloseProfileMenu,
}) {
  const location = useLocation();
  const isAdmin  = hasPermission(profile?.role, "access_admin");

  // Show date range picker only on overview and metrics pages
  const isOverview = location.pathname === "/dashboard" || location.pathname === "/dashboard/";
  const isMetrics  = location.pathname.includes("/metrics");
  const showDateRange = isOverview || isMetrics;

  const [themeMenuOpen, setThemeMenuOpen]   = useState(false);
  const [isMobileLayout, setIsMobileLayout] = useState(false);
  const themeMenuRef  = useRef(null);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return undefined;
    const mq = window.matchMedia("(max-width: 768px)");
    function update() { setIsMobileLayout(mq.matches); }
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const displayName =
    profile?.full_name ||
    profile?.name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "User";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || "";

  useEffect(() => {
    function handleOutsideClick(event) {
      if (!themeMenuRef.current?.contains(event.target)) setThemeMenuOpen(false);
    }
    if (themeMenuOpen) document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [themeMenuOpen]);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (!profileMenuRef.current?.contains(event.target)) onCloseProfileMenu?.();
    }
    if (profileMenuOpen) document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [profileMenuOpen, onCloseProfileMenu]);

  useEffect(() => {
    function onKey(event) {
      if (event.key === "Escape") setThemeMenuOpen(false);
    }
    if (themeMenuOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [themeMenuOpen]);

  async function handleSignOut() {
    if (supabase) await supabase.auth.signOut();
    onCloseProfileMenu?.();
    onSignOut?.();
  }

  const themeOptions = [
    { id: "light", label: "Light" },
    { id: "dark",  label: "Dark" },
    { id: "system", label: "System" },
  ];

  const themeMenu = (
    <div className="db-theme-menu-wrap" ref={themeMenuRef}>
      <button
        type="button"
        className="db-theme-toggle-btn"
        onClick={() => { setThemeMenuOpen((o) => !o); onCloseProfileMenu?.(); }}
        aria-expanded={themeMenuOpen}
        aria-label="Open theme menu"
      >
        <ThemeIcon type={themeMode} />
      </button>
      {themeMenuOpen && (
        <div className="db-theme-menu">
          {themeOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`db-theme-menu-item ${themeMode === option.id ? "is-active" : ""}`}
              onClick={() => { onThemeModeChange(option.id); setThemeMenuOpen(false); }}
            >
              <span className="db-theme-item-icon"><ThemeIcon type={option.id} /></span>
              <span>{option.label}</span>
              {themeMode === option.id ? <span className="db-theme-item-check">✓</span> : null}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const profileMenu = (
    <div className="db-topbar-profile-wrap" ref={profileMenuRef}>
      {profileMenuOpen && (
        <DashboardProfileDropdownMenu
          variant="topbar"
          displayName={displayName}
          email={user?.email}
          isAdmin={isAdmin}
          onSignOut={handleSignOut}
          onClose={onCloseProfileMenu}
        />
      )}
      <button
        type="button"
        className="db-topbar-profile-btn"
        aria-expanded={profileMenuOpen}
        aria-haspopup="menu"
        aria-label="Account menu"
        onClick={() => { onProfileMenuToggle?.(); setThemeMenuOpen(false); }}
      >
        {avatarUrl
          ? <img src={avatarUrl} alt="" className="db-topbar-profile-img" />
          : initials || "U"}
      </button>
    </div>
  );

  return (
    <div className="db-topbar">
      {/* Mobile hamburger */}
      <button
        type="button"
        className="db-topbar-burger"
        onClick={() => onMobileMenuOpen?.()}
        aria-label="Open navigation menu"
      >
        <span /><span /><span />
      </button>

      {/* Search bar */}
      <div className="db-topbar-search-field">
        <SearchGlassIcon />
        <input
          type="text"
          className="db-topbar-search-input"
          placeholder={isMobileLayout ? "Search..." : "Search team members, content, and more..."}
          aria-label="Search dashboard"
        />
      </div>

      {/* Right-side actions */}
      <div className="db-topbar-actions">
        {/* Date range — only on overview + metrics */}
        {showDateRange && !isMobileLayout && <DateRangePicker />}

        {/* Notification bell — always visible */}
        <NotificationBell />

        {/* Theme toggle — always visible */}
        {themeMenu}

        {/* Profile — always visible */}
        {profileMenu}
      </div>
    </div>
  );
}
