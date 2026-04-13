import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./ResetPasswordPage.css";
import { missingSupabaseMessage, supabase } from "../lib/supabaseClient";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function handleReset(event) {
    event.preventDefault();
    setError("");
    setInfo("");

    if (!supabase) {
      setError(missingSupabaseMessage);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setInfo("Password updated successfully. Redirecting to login...");
    window.setTimeout(() => {
      navigate("/login");
    }, 1200);
  }

  return (
    <main className="reset-page">
      <section className="reset-card">
        <h1>Reset your password</h1>
        <p>Set your new password and continue to SalesGym.</p>

        <form onSubmit={handleReset}>
          <label htmlFor="reset-password">New Password</label>
          <input
            id="reset-password"
            type="password"
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          <label htmlFor="reset-confirm">Confirm Password</label>
          <input
            id="reset-confirm"
            type="password"
            minLength={6}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>

        {error ? <p className="reset-error">{error}</p> : null}
        {info ? <p className="reset-info">{info}</p> : null}

        <Link to="/login" className="reset-back">
          Back to login
        </Link>
      </section>
    </main>
  );
}
