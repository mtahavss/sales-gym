import { useEffect, useRef, useState } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import LandingPage from "./components/LandingPage";
import LoginPage from "./components/LoginPage";
import DashboardPage from "./components/DashboardPage";
import DashboardHome from "./components/dashboard/DashboardHome";
import DashboardMetrics from "./components/dashboard/DashboardMetrics";
import DashboardCallLibrary from "./components/dashboard/DashboardCallLibrary";
import DashboardAiRoleplay from "./components/dashboard/DashboardAiRoleplay";
import TrainingSessionPage from "./components/dashboard/TrainingSessionPage";
import DashboardScorecards from "./components/dashboard/DashboardScorecards";
import DashboardTeam from "./components/dashboard/DashboardTeam";
import DashboardTeamMember from "./components/dashboard/DashboardTeamMember";
import DashboardSettings from "./components/dashboard/DashboardSettings";
import DashboardContactSupport from "./components/dashboard/DashboardContactSupport";
import ResetPasswordPage from "./components/ResetPasswordPage";
import AdminPage from "./components/AdminPage";
import { isSupabaseConfigured, supabase } from "./lib/supabaseClient";
import { hasPermission } from "./lib/rbac";
import { ensureUserProfile } from "./lib/userProfile";
import { DateRangeProvider } from "./lib/DateRangeContext";
import ThemeSpinner from "./components/ThemeSpinner";

/** Keep the same React state reference when the signed-in account is unchanged (id + email). */
function mergeAuthUser(prev, session) {
  const next = session?.user ?? null;
  if (!next && !prev) {
    return prev;
  }
  if (!next) {
    return null;
  }
  if (!prev) {
    return next;
  }
  if (prev.id === next.id && prev.email === next.email) {
    return prev;
  }
  return next;
}

function AppShellLayout() {
  return (
    <DateRangeProvider>
      <div className="app-shell">
        <Outlet />
      </div>
    </DateRangeProvider>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [profile, setProfile] = useState(null);
  const [profileReady, setProfileReady] = useState(false);
  /** After a successful profile load for `userId:email`, skip refetch when Supabase churns the user object. */
  const loadedProfileKeyRef = useRef(null);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setAuthReady(true);
      return undefined;
    }

    let mounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) {
        return;
      }
      // Tab refocus often triggers token refresh; a new `user` object reference would rerun
      // profile loading and flash the full-app spinner. Session is still updated in the client.
      if (event === "TOKEN_REFRESHED") {
        return;
      }
      setUser((prev) => mergeAuthUser(prev, session));
    });

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) {
          return;
        }
        setUser((prev) => mergeAuthUser(prev, data.session));
      })
      .catch(() => {
        if (!mounted) {
          return;
        }
        setUser(null);
      })
      .finally(() => {
        if (!mounted) {
          return;
        }
        setAuthReady(true);
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      loadedProfileKeyRef.current = null;
      setProfile(null);
      setProfileReady(true);
      return;
    }

    const profileKey = `${user.id}\u0000${user.email ?? ""}`;
    if (loadedProfileKeyRef.current === profileKey) {
      return;
    }

    let mounted = true;
    setProfileReady(false);

    const fallbackProfile = {
      id: user.id,
      email: user.email,
      full_name: user.email?.split("@")[0] || "User",
      role: "viewer",
    };

    const PROFILE_TIMEOUT_MS = 20000;
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = window.setTimeout(() => reject(new Error("profile-timeout")), PROFILE_TIMEOUT_MS);
    });

    Promise.race([ensureUserProfile(user), timeoutPromise])
      .then((profileRow) => {
        if (mounted) {
          setProfile(profileRow);
        }
      })
      .catch(() => {
        if (mounted) {
          setProfile(fallbackProfile);
        }
      })
      .finally(() => {
        window.clearTimeout(timeoutId);
        if (mounted) {
          setProfileReady(true);
          loadedProfileKeyRef.current = profileKey;
        }
      });

    return () => {
      mounted = false;
    };
  }, [user]);

  if (!authReady || !profileReady) {
    return (
      <div className="app-shell app-shell--loading">
        <ThemeSpinner size="lg" label="Loading application" />
      </div>
    );
  }

  function handleSignedOut() {
    setUser(null);
    setProfile(null);
  }

  return (
    <Routes>
      <Route
        path="/call-session"
        element={
          user && profile ? (
            <TrainingSessionPage user={user} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route element={<AppShellLayout />}>
        <Route
          path="/"
          element={
            <>
              <Navbar user={user} profile={profile} onSignOut={handleSignedOut} />
              <LandingPage user={user} profile={profile} />
            </>
          }
        />
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" replace /> : <LoginPage onAuthSuccess={setUser} />}
        />
        <Route
          path="/dashboard"
          element={
            user && profile ? (
              <DashboardPage user={user} profile={profile} onSignOut={handleSignedOut} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route index element={<DashboardHome user={user} profile={profile} />} />
          <Route path="metrics" element={<DashboardMetrics user={user} profile={profile} />} />
          <Route path="call-library" element={<DashboardCallLibrary />} />
          <Route path="ai-roleplay" element={<DashboardAiRoleplay user={user} />} />
          <Route path="scorecards" element={<DashboardScorecards />} />
          <Route path="team" element={<DashboardTeam user={user} profile={profile} />} />
          <Route path="team/:memberId" element={<DashboardTeamMember user={user} profile={profile} />} />
          <Route path="support" element={<DashboardContactSupport user={user} />} />
          <Route path="settings" element={<DashboardSettings user={user} profile={profile} onProfileUpdate={(updates) => setProfile((p) => ({ ...p, ...updates }))} />} />
        </Route>
        <Route
          path="/admin"
          element={
            user && profile ? (
              hasPermission(profile.role, "access_admin") ? (
                <AdminPage profile={profile} />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
