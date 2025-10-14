import { useState } from "react";
import { useAuth } from "../../../contexts/AuthContext.jsx";
import Theme from "../../../contexts/Theme.jsx";
import UserCreateModal from "./UserCreateModal.jsx";

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
    setError(""); // reset error

    try {
      const result = await login(email, password, rememberMe);
      // If login returns nothing or user is null
      if (!result || !result.success) {
        setError(
          result?.message || "Login failed. Please check your credentials."
        );
        return;
      }

      // Remember Me
      if (rememberMe) localStorage.setItem("rememberMe", "true");
      else localStorage.removeItem("rememberMe");

      onSuccess?.(); // close modal
    } catch (err) {
      setError(
        err.message || "An unexpected error occurred. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Modern Header with BLGF Logo */}
      <div className="text-center mb-8">
        <div className="relative mb-6">
          {/* BLGF Logo Container */}
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-2xl shadow-lg flex items-center justify-center mb-4 transform hover:scale-105 transition-transform duration-300">
            <div className="text-white font-bold text-lg">
              <span className="block text-xs">BLGF</span>
              <span className="block text-[10px] -mt-1">Caraga</span>
            </div>
          </div>
          
          {/* Background decoration */}
          <div className="absolute -top-2 -left-2 w-24 h-24 bg-primary/20 rounded-2xl -z-10 animate-pulse"></div>
          <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-secondary/20 rounded-xl -z-10 animate-pulse delay-75"></div>
        </div>
        
        <h1 className="text-2xl font-bold text-base-content mb-2">
          Welcome Back
        </h1>
        <p className="text-base-content/60">
          Bureau of Local Government Finance - CARAGA
        </p>
      </div>

      {/* Modern Card Design */}
      <div className="card bg-base-100 shadow-2xl border border-base-300/30 backdrop-blur-sm">
        <div className="card-body p-8 space-y-6">
          {error && (
            <div className="alert alert-error p-3 text-sm rounded-xl bg-error/10 border border-error/20 text-error animate-shake">
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Enhanced Email Input */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium text-base-content/80">Email Address</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="input input-bordered w-full pl-12 h-12 bg-base-200/50 border-base-300 focus:border-primary focus:bg-base-100 transition-all duration-200"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
                <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"/>
                </svg>
              </div>
            </div>

            {/* Enhanced Password Input */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium text-base-content/80">Password</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="input input-bordered w-full pl-12 pr-12 h-12 bg-base-200/50 border-base-300 focus:border-primary focus:bg-base-100 transition-all duration-200"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content transition-colors duration-200"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"/>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Enhanced Remember me */}
            <div className="flex items-center justify-between">
              <label className="label cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary mr-3 checkbox-sm"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="label-text text-base-content/70">Remember me</span>
              </label>
              <button type="button" className="link link-primary text-sm hover:text-primary/80">
                Forgot password?
              </button>
            </div>

            {/* Enhanced Sign In Button */}
            <button
              type="submit"
              className="btn btn-primary w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 border-0 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="loading loading-spinner loading-sm"></span>
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
                  </svg>
                  Sign In
                </span>
              )}
            </button>
          </form>

          {/* Modern Divider */}
          <div className="divider text-base-content/40">
            <span className="bg-base-100 px-4">or continue with</span>
          </div>

          {/* Enhanced Social Login Buttons */}
          <div className="space-y-3">
            <button className="btn btn-outline w-full h-11 border-base-300 hover:border-red-500 hover:bg-red-50 hover:text-red-600 group transition-all duration-200" disabled={loading}>
              <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-200" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
            
            <button className="btn btn-outline w-full h-11 border-base-300 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 group transition-all duration-200" disabled={loading}>
              <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-200" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.15 2.587L18.21.21a1.494 1.494 0 0 0-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 0 0-1.276.057L.327 7.261A1 1 0 0 0 .326 8.74L3.899 12 .326 15.26a1 1 0 0 0 .001 1.479L1.65 17.94a.999.999 0 0 0 1.276.057l4.12-3.128 9.46 8.63a1.492 1.492 0 0 0 1.704.29l4.942-2.377A1.5 1.5 0 0 0 24 20.06V3.939a1.5 1.5 0 0 0-.85-1.352z"/>
              </svg>
              Continue with Microsoft
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Footer */}
      <div className="text-center mt-6 p-4 bg-base-200/30 rounded-xl backdrop-blur-sm">
        <p className="text-sm text-base-content/60">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={() => {
              onClose(); // close login
              onRequestAccess(); // open create modal
            }}
            className="link link-primary font-semibold hover:text-primary/80 transition-colors duration-200"
          >
            Request Access
          </button>
        </p>
        <p className="text-xs text-base-content/40 mt-2">
          © 2025 Bureau of Local Government Finance - CARAGA Region
        </p>
      </div>
    </div>
  );
}