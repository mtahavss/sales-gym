import "./LoginPage.css";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { missingSupabaseMessage, supabase } from "../lib/supabaseClient";

function GoogleLogo() {
  return (
    <svg className="google-logo" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.9 3.5 14.7 2.5 12 2.5 6.8 2.5 2.6 6.7 2.6 12s4.2 9.5 9.4 9.5c5.4 0 9-3.8 9-9.1 0-.6-.1-1.1-.2-1.5H12z"
      />
      <path fill="#FBBC05" d="M3.7 7.6l3.2 2.3C7.7 8 9.7 6.5 12 6.5c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.9 3.5 14.7 2.5 12 2.5 8.3 2.5 5.1 4.6 3.7 7.6z" />
      <path fill="#34A853" d="M12 21.5c2.7 0 4.9-.9 6.5-2.5l-3-2.3c-.8.6-1.9 1.1-3.5 1.1-3.9 0-5.3-2.6-5.5-3.9L3.2 16c1.4 3 4.6 5.5 8.8 5.5z" />
      <path fill="#4285F4" d="M20.8 10.5H12v3.6h5.1c-.2 1-.8 1.9-1.6 2.6l3 2.3c1.7-1.6 2.7-3.9 2.7-6.9 0-.6-.1-1.1-.2-1.6z" />
    </svg>
  );
}

export default function LoginPage({ onAuthSuccess }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function handleGoogleLogin() {
    setError("");
    setInfo("");

    if (!supabase) {
      setError(missingSupabaseMessage);
      return;
    }

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin
      }
    });

    if (oauthError) {
      setError(oauthError.message);
    }
  }

  async function handleEmailAuth(event) {
    event.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
console.log("handleEmailAuth", email, password);
    try {
      if (!supabase) {
        throw new Error(missingSupabaseMessage);
      }

      if (isSigningUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password
        });

        if (signUpError) {
          throw signUpError;
        }

        setInfo("Account created. Check your email to confirm your account.");
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) {
          throw signInError;
        }

        onAuthSuccess(data.session?.user ?? data.user ?? null);
        navigate("/dashboard");
      }
    } catch (authError) {
      setError(authError.message || "Authentication failed. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSendResetLink() {
    setError("");
    setInfo("");

    if (!supabase) {
      setError(missingSupabaseMessage);
      return;
    }

    if (!email) {
      setError("Enter your email first.");
      return;
    }

    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setInfo("Password reset link sent. Check your inbox.");
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="login-panel-inner">
          <div className="login-brand">
            <span className="login-brand-mark">SG</span>
            <span>SalesGym</span>
          </div>

          <h1>Welcome back</h1>
          <p className="login-subtitle">Sign in to your account to continue</p>
          <p className="login-helper">
            {isSigningUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              className="link-btn"
              onClick={() => {
                setIsResetMode(false);
                setIsSigningUp((value) => !value);
              }}
            >
              {isSigningUp ? "Sign in" : "Create one"}
            </button>
          </p>

          <button type="button" className="login-google-btn" onClick={handleGoogleLogin}>
            <GoogleLogo />
            Continue with Google
          </button>

          <div className="login-divider">or</div>

          <form onSubmit={handleEmailAuth}>
            <label className="sr-only" htmlFor="login-email">
              Email address
            </label>
            <input
              id="login-email"
              type="email"
              placeholder="Enter an email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            {!isResetMode ? (
              <>
                <label className="sr-only" htmlFor="login-password">
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={6}
                  required
                />

                <button type="submit" className="login-email-btn" disabled={loading}>
                  {loading
                    ? "Please wait..."
                    : isSigningUp
                      ? "Create Account"
                      : "Continue with Email"}
                </button>
              </>
            ) : (
              <button
                type="button"
                className="login-email-btn"
                disabled={loading}
                onClick={handleSendResetLink}
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            )}
          </form>

          <button
            type="button"
            className="link-btn login-forgot-btn"
            onClick={() => {
              setIsSigningUp(false);
              setIsResetMode((value) => !value);
            }}
          >
            {isResetMode ? "Back to Sign In" : "Forgot Password?"}
          </button>

          {error ? <p className="login-error">{error}</p> : null}
          {info ? <p className="login-info">{info}</p> : null}

          <p className="login-terms">
            By continuing, you agree to our Terms and Privacy Policy.
          </p>

          <Link to="/" className="login-back-btn">
            Back to home
          </Link>
        </div>
      </section>

      <section className="login-visual" aria-hidden="true">
        <div className="scene-overlay" />
        <div className="pagoda pagoda-left" />
        <div className="pagoda pagoda-center" />
        <div className="pagoda pagoda-right" />
        <div className="samurai" />
      </section>
    </main>
  );
}
