import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth } from "../contexts/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const result = await login(email, password);

      if (result.success) {
        // Store remember me preference
        if (rememberMe) {
          localStorage.setItem("rememberMe", "true");
        } else {
          localStorage.removeItem("rememberMe");
        }

        navigate("/dashboard");
      } else {
        setError(result.message || "Failed to log in");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-base-200 to-secondary/10 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo/Brand section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4">
            <img
              src="https://blgf.gov.ph/wp-content/uploads/2022/05/BLGF-Seal-HD-768x768.png"
              alt="BLGF Logo"
              className="w-10 h-10 object-contain"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextElementSibling.style.display = "flex";
              }}
            />
            <div className="w-10 h-10 bg-primary text-primary-content rounded-full flex items-center justify-center font-bold hidden">
              B
            </div>
          </div>
          <h1 className="text-2xl font-bold text-base-content mb-2">
            BLGF Portal Login
          </h1>
          <p className="text-base-content/60">
            Sign in to access the assessment management system
          </p>
        </div>

        {/* Main login card */}
        <div className="card bg-base-100 shadow-2xl border border-base-300/20 backdrop-blur-sm">
          <div className="card-body space-y-6">
            {/* Error Alert */}
            {error && (
              <div className="alert alert-error shadow-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 shrink-0 stroke-current"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-sm">{error}</span>
                <button
                  className="btn btn-ghost btn-xs"
                  onClick={() => setError("")}
                >
                  ✕
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Email address</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    required
                    autoComplete="email"
                    className={`input input-bordered w-full pr-10 transition-all duration-200 ${
                      error ? "input-error" : "focus:input-primary"
                    }`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={!!error}
                    disabled={loading}
                  />
                  <svg
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-base-content/40"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                    />
                  </svg>
                </div>
              </div>

              {/* Password Input */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Password</span>
                  <span className="label-text-alt">
                    <Link
                      to="/forgot-password"
                      className="link link-hover text-xs"
                    >
                      Forgot password?
                    </Link>
                  </span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    className={`input input-bordered w-full pr-10 transition-all duration-200 ${
                      error ? "input-error" : "focus:input-primary"
                    }`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-base-content/40 hover:text-base-content transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Remember me checkbox */}
              <div className="form-control">
                <label className="label cursor-pointer justify-start">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary checkbox-sm mr-3"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={loading}
                  />
                  <span className="label-text">Remember me for 30 days</span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="form-control">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-full gap-2 transition-all duration-200 hover:shadow-lg disabled:opacity-50"
                >
                  {loading && (
                    <span className="loading loading-spinner loading-sm"></span>
                  )}
                  {loading ? "Signing in..." : "Sign in"}
                </button>
              </div>
            </form>

            {/* Divider */}
            <div className="divider text-base-content/40">or continue with</div>

            {/* Social Login Options */}
            <div className="space-y-3">
              <button
                type="button"
                className="btn btn-outline w-full gap-2 hover:bg-base-200"
                onClick={() => console.log("Google login clicked")}
                disabled={loading}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </button>

              <button
                type="button"
                className="btn btn-outline w-full gap-2 hover:bg-base-200"
                onClick={() => console.log("Microsoft login clicked")}
                disabled={loading}
              >
                <svg className="w-5 h-5" viewBox="0 0 23 23">
                  <path fill="#f3f3f3" d="M0 0h23v23H0z" />
                  <path fill="#f1511b" d="M1 1h10v10H1z" />
                  <path fill="#80cc28" d="M12 1h10v10H12z" />
                  <path fill="#00adef" d="M1 12h10v10H1z" />
                  <path fill="#fbca01" d="M12 12h10v10H12z" />
                </svg>
                Microsoft
              </button>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="text-center mt-8 space-y-4">
          <p className="text-sm text-base-content/60">
            Don't have an account?{" "}
            <Link to="/register" className="link link-primary font-medium">
              Request access
            </Link>
          </p>

          <div className="flex justify-center space-x-4 text-sm">
            <Link to="/" className="link link-hover text-base-content/60">
              ← Back to home
            </Link>
            <span className="text-base-content/40">•</span>
            <Link to="/help" className="link link-hover text-base-content/60">
              Need help?
            </Link>
          </div>
        </div>

        {/* System info */}
        <div className="mt-6 p-4 bg-info/10 rounded-lg border border-info/20">
          <p className="text-xs text-info font-medium mb-2">
            BLGF Assessment Management System
          </p>
          <p className="text-xs text-base-content/70">
            Version 2.1.0 • For official use only
          </p>
        </div>
      </div>
    </div>
  );
}
