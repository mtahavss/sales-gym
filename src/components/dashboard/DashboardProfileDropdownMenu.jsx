import { useNavigate } from "react-router-dom";

/**
 * Single source of truth for account menu content — used by sidebar and topbar
 * so updates apply to both popups.
 */
export default function DashboardProfileDropdownMenu({
  displayName,
  email,
  isAdmin,
  onSignOut,
  onClose,
  onNavigate,
  variant = "sidebar"
}) {
  const navigate = useNavigate();
  const rootClass =
    variant === "topbar" ? "db-profile-dropdown db-profile-dropdown--topbar" : "db-profile-dropdown";

  return (
    <div className={rootClass} role="menu">
      <div className="db-profile-dropdown-head">
        <p className="db-profile-dropdown-name">{displayName}</p>
        <p className="db-profile-dropdown-email">{email || "No email"}</p>
      </div>
      <button
        type="button"
        className="db-profile-menu-item"
        onClick={() => {
          onClose?.();
          onNavigate?.();
          navigate("/dashboard/settings");
        }}
      >
        Settings
      </button>
      <button
        type="button"
        className="db-profile-menu-item"
        onClick={() => {
          onClose?.();
          onNavigate?.();
          navigate("/dashboard/support");
        }}
      >
        Contact Support
      </button>
      {isAdmin ? (
        <button
          type="button"
          className="db-profile-menu-item"
          onClick={() => {
            onClose?.();
            onNavigate?.();
            navigate("/admin");
          }}
        >
          Admin Console
        </button>
      ) : null}
      <button type="button" className="db-profile-menu-item db-profile-menu-item-danger" onClick={onSignOut}>
        Log out
      </button>
    </div>
  );
}
