import "./Navbar.css";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { hasPermission } from "../lib/rbac";

export default function Navbar({ user, profile, onSignOut }) {
  const isAdmin = hasPermission(profile?.role, "access_admin");

  async function handleSignOut() {
    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();
    onSignOut();
  }

  return (
    <header className="navbar-wrap">
      <nav className="navbar">
        <a href="#" className="brand">
          <span className="brand-mark" aria-hidden="true">
            SG
          </span>
          <span>Sales Gym</span>
        </a>

        <ul className="nav-links">
          <li>
            <a href="#product">Product</a>
          </li>
          <li>
            <a href="#results">Results</a>
          </li>
          <li>
            <a href="#contact">Contact</a>
          </li>
        </ul>

        <div className="nav-actions">
          {user ? (
            <>
              <Link to="/dashboard" className="btn btn-light">
                Dashboard
              </Link>
              {isAdmin ? (
                <Link to="/admin" className="btn btn-light">
                  Admin
                </Link>
              ) : null}
              <button type="button" className="btn btn-light" onClick={handleSignOut}>
                Log Out
              </button>
            </>
          ) : (
            <Link to="/login" className="btn btn-light">
              Log In
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
