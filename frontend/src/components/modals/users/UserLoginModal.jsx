import { useState } from "react";
import { useAuth } from "../../../contexts/AuthContext.jsx";
import { X, Eye, EyeOff, LogIn } from "lucide-react";

export default function UserLoginPage({ onSuccess, onClose, onRequestAccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await login(email, password, rememberMe);
      if (!result || !result.success) {
        setError(
          result?.message || "Login failed. Please check your credentials."
        );
        return;
      }

      if (rememberMe) localStorage.setItem("rememberMe", "true");
      else localStorage.removeItem("rememberMe");

      onSuccess?.();
    } catch (err) {
      setError(
        err.message || "An unexpected error occurred. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-base-300/80 backdrop-blur-sm flex items-center justify-center z-[1000] p-4 font-sans transition-all duration-300">
      {/* Login Card Container - Clean & Professional */}
      <div className="relative w-full max-w-md bg-base-100 rounded-3xl shadow-2xl border border-base-200 overflow-hidden transform transition-all">

        {/* Subtle decorative top bar */}
        <div className="h-2 w-full bg-gradient-to-r from-primary to-secondary"></div>

        <div className="p-8 sm:p-10 relative">

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 btn btn-circle btn-ghost btn-sm text-base-content/40 hover:bg-base-200 hover:text-base-content transition-colors"
          >
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-24 h-24 mb-6 bg-transparent">
              <img
                src="https://blgf.gov.ph/wp-content/uploads/2022/05/BLGF-Seal-Regular.png"
                alt="BLGF Logo"
                className="w-full h-full object-contain drop-shadow-md"
              />
            </div>
            <h1 className="text-3xl font-bold text-base-content tracking-tight">
              Welcome Back
            </h1>
            <p className="text-sm text-base-content/60 mt-2">
              Sign in to verify your account
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="alert alert-error text-sm py-3 mb-6 shadow-sm rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Email Input */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium text-base-content/80">Email Address</span>
              </label>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="input input-bordered w-full rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 bg-base-200/50 hover:bg-base-200 transition-all text-base-content placeholder:text-base-content/40"
              />
            </div>

            {/* Password Input */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium text-base-content/80">Password</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="input input-bordered w-full rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 bg-base-200/50 hover:bg-base-200 transition-all text-base-content pr-12 placeholder:text-base-content/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 btn btn-ghost btn-circle btn-xs text-base-content/40 hover:text-base-content"
                >
                  {showPassword ? (
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" /><path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" /></svg>
                  ) : (
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                  )}
                </button>
              </div>
            </div>

            {/* Options Row */}
            <div className="flex items-center justify-between text-sm mt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="checkbox checkbox-primary checkbox-sm rounded-md"
                />
                <span className="text-base-content/70 group-hover:text-base-content transition-colors">Remember me</span>
              </label>

              <button
                type="button"
                className="btn btn-link btn-xs no-underline hover:no-underline text-primary/80 hover:text-primary font-normal px-0"
              >
                Forgot Password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`btn btn-primary w-full rounded-xl text-lg font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 mt-2 transition-all`}
            >
              {loading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Create Account Link */}
          <div className="text-center mt-8 pt-6 border-t border-base-200">
            <p className="text-sm text-base-content/60">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRequestAccess();
                }}
                className="text-primary font-bold hover:underline ml-1 cursor-pointer"
              >
                Create Account
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}