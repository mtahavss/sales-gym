import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import "./dashboard/dashboard.css";
import { hasPermission } from "../lib/rbac";
import DashboardSidebar from "./dashboard/DashboardSidebar";
import DashboardTopbar from "./dashboard/DashboardTopbar";
import ChatWidget from "./dashboard/ChatWidget";

export default function DashboardPage({ user, profile, onSignOut }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  /** One account menu at a time: sidebar opens upward, topbar opens downward — same panel content */
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);

  useEffect(() => {
    function onResize() {
      if (window.innerWidth > 768 && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    }

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [mobileMenuOpen]);

  const [themeMode, setThemeMode] = useState(() => {
    const savedTheme = window.localStorage.getItem("dashboard_theme");
    return savedTheme === "dark" || savedTheme === "light" || savedTheme === "system" ? savedTheme : "light";
  });
  const [systemPrefersDark, setSystemPrefersDark] = useState(() =>
    window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)").matches : false
  );

  useEffect(() => {
    window.localStorage.setItem("dashboard_theme", themeMode);
  }, [themeMode]);

  useEffect(() => {
    if (!window.matchMedia) {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    function handleChange(event) {
      setSystemPrefersDark(event.matches);
    }

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const canEdit = hasPermission(profile?.role, "edit_content");
  const theme = themeMode === "system" ? (systemPrefersDark ? "dark" : "light") : themeMode;

  function toggleProfileMenu(anchor) {
    setProfileMenuAnchor((prev) => (prev === anchor ? null : anchor));
  }

  function closeProfileMenu() {
    setProfileMenuAnchor(null);
  }

  useEffect(() => {
    if (!profileMenuAnchor) {
      return undefined;
    }
    function onKey(event) {
      if (event.key === "Escape") {
        setProfileMenuAnchor(null);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [profileMenuAnchor]);

  return (
    <main className={`dashboard-shell ${theme === "dark" ? "is-dark" : ""}`}>
      {mobileMenuOpen ? (
        <button
          type="button"
          className="db-sidebar-backdrop"
          aria-label="Close menu"
          onClick={() => setMobileMenuOpen(false)}
        />
      ) : null}
      <DashboardSidebar
        user={user}
        profile={profile}
        onSignOut={onSignOut}
        mobileOpen={mobileMenuOpen}
        onNavigate={() => setMobileMenuOpen(false)}
        profileMenuOpen={profileMenuAnchor === "sidebar"}
        onProfileMenuToggle={() => toggleProfileMenu("sidebar")}
        onCloseProfileMenu={closeProfileMenu}
      />
      <section className="dashboard-content">
        <DashboardTopbar
          canEdit={canEdit}
          themeMode={themeMode}
          onThemeModeChange={setThemeMode}
          user={user}
          profile={profile}
          onSignOut={onSignOut}
          onMobileMenuOpen={() => setMobileMenuOpen(true)}
          profileMenuOpen={profileMenuAnchor === "topbar"}
          onProfileMenuToggle={() => toggleProfileMenu("topbar")}
          onCloseProfileMenu={closeProfileMenu}
        />
        <Outlet />
      </section>
      <ChatWidget user={user} />
    </main>
  );
}
