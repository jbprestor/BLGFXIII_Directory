import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth } from "../../contexts/AuthContext.jsx";
import Theme from "../../contexts/Theme.jsx";

export default function LoginPage({ onSuccess }) {
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
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        if (rememberMe) {
          localStorage.setItem("rememberMe", "true");
        } else {
          localStorage.removeItem("rememberMe");
        }
        onSuccess?.();
        navigate("/dashboard");
      } else {
        setError(result.message || "Failed to log in");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold text-base-content">BLGF Portal</h1>
        <p className="text-sm text-base-content/60">
          Sign in to continue
        </p>
      </div>

      <div className="card bg-base-100 shadow-lg border border-base-300/20">
        <div className="card-body space-y-4">
          {error && (
            <div className="alert alert-error p-2 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <input
              type="email"
              placeholder="Email"
              className="input input-bordered w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />

            {/* Password */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="input input-bordered w-full pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>

            {/* Remember me */}
            <label className="label cursor-pointer">
              <input
                type="checkbox"
                className="checkbox checkbox-primary mr-2"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className="label-text">Remember me</span>
            </label>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="divider">or</div>

          {/* Social logins */}
          <button className="btn btn-outline w-full" disabled={loading}>
            Google
          </button>
          <button className="btn btn-outline w-full" disabled={loading}>
            Microsoft
          </button>
        </div>
      </div>

      <p className="mt-4 text-sm text-center text-base-content/60">
        Don’t have an account?{" "}
        <Link to="/register" className="link link-primary">Request access</Link>
      </p>
    </div>
  );
}

