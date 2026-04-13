import { useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { hasPermission } from "../../lib/rbac";
import DashboardProfileDropdownMenu from "./DashboardProfileDropdownMenu";

const navGroups = [
  {
    title: "Analytics",
    items: [
      { label: "Overview", to: "/dashboard", end: true },
      { label: "Metrics", to: "/dashboard/metrics" },
      { label: "Call Library", to: "/dashboard/call-library" }
    ]
  },
  {
    title: "Training",
    items: [
      { label: "AI Roleplay", to: "/dashboard/ai-roleplay" },
      { label: "LMS", to: null }
    ]
  },
  {
    title: "Manage",
    items: [
      { label: "Scorecards", to: "/dashboard/scorecards" },
      { label: "Team", to: "/dashboard/team" }
    ]
  }
];

export default function DashboardSidebar({
  user,
  profile,
  onSignOut,
  mobileOpen = false,
  onNavigate,
  profileMenuOpen = false,
  onProfileMenuToggle,
  onCloseProfileMenu
}) {
  const canEdit = hasPermission(profile?.role, "edit_content");
  const isAdmin = hasPermission(profile?.role, "access_admin");
  const profileMenuRef = useRef(null);
  const displayName =
    profile?.full_name ||
    profile?.name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Profile";
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || "";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

  useEffect(() => {
    function handleOutsideClick(event) {
      if (!profileMenuRef.current?.contains(event.target)) {
        onCloseProfileMenu?.();
      }
    }

    if (profileMenuOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }

    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [profileMenuOpen, onCloseProfileMenu]);

  async function handleSignOut() {
    if (supabase) {
      await supabase.auth.signOut();
    }
    onCloseProfileMenu?.();
    onSignOut();
  }

  return (
    <aside className={`db-sidebar ${mobileOpen ? "is-drawer-open" : ""}`}>
      <div className="db-logo-row">
        <div className="db-logo-mark">S</div>
        <span>Sales</span>
      </div>

      <button type="button" className="db-upload-btn" disabled={!canEdit}>
        Upload Call Recording
      </button>

      <nav className="db-nav">
        {navGroups.map((group) => (
          <div key={group.title} className="db-nav-group">
            <p>{group.title}</p>
            {group.items.map((item) =>
              item.to ? (
                <NavLink
                  key={item.label}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => (isActive ? "is-active" : undefined)}
                  onClick={() => onNavigate?.()}
                >
                  {item.label}
                </NavLink>
              ) : (
                <a key={item.label} href="#" className="db-nav-disabled" onClick={(e) => e.preventDefault()}>
                  {item.label}
                </a>
              )
            )}
          </div>
        ))}
      </nav>

      <div className="db-sidebar-footer">
        <NavLink to="/" className="db-help-btn" onClick={() => onNavigate?.()}>
          Help Docs
        </NavLink>
        <div className="db-profile-menu-wrap" ref={profileMenuRef}>
          {profileMenuOpen ? (
            <DashboardProfileDropdownMenu
              variant="sidebar"
              displayName={displayName}
              email={user?.email}
              isAdmin={isAdmin}
              onSignOut={handleSignOut}
              onClose={onCloseProfileMenu}
              onNavigate={onNavigate}
            />
          ) : null}

          <button
            type="button"
            className="db-profile-settings-btn"
            aria-expanded={profileMenuOpen}
            aria-haspopup="menu"
            onClick={() => onProfileMenuToggle?.()}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="db-profile-avatar" />
            ) : (
              <span className="db-profile-avatar db-profile-avatar-fallback">{initials || "P"}</span>
            )}
            <span className="db-profile-text">
              <span className="db-profile-name">{displayName}</span>
              <span className="db-user-email">{user?.email || "No email"}</span>
            </span>
            <span className={`db-profile-chevron ${profileMenuOpen ? "is-open" : ""}`} aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  );
}
