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
    <div 
      style={{ 
        width: '100%',
        maxWidth: '480px',
        margin: '0 auto',
        padding: '20px',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      {/* Beautiful Header with BLGF Logo */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        {/* Logo Container */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          marginBottom: '30px',
          position: 'relative',
          height: '140px',
          alignItems: 'center'
        }}>
          {/* Beautiful BLGF Logo */}
          <div 
            style={{
              position: 'relative',
              width: '120px',
              height: '120px',
              background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 50%, #059669 100%)',
              borderRadius: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '4px solid rgba(255, 255, 255, 0.3)',
              transition: 'transform 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          >
            {/* Government Seal Content */}
            <div style={{ textAlign: 'center', color: 'white', position: 'relative' }}>
              {/* BLGF Text */}
              <div style={{ 
                fontSize: '24px', 
                fontWeight: '900', 
                lineHeight: '1',
                letterSpacing: '1px'
              }}>
                BLGF
              </div>
              {/* Caraga Text */}
              <div style={{ 
                fontSize: '14px', 
                fontWeight: '700', 
                lineHeight: '1',
                marginTop: '4px',
                opacity: '0.9'
              }}>
                CARAGA
              </div>
              
              {/* Decorative Elements */}
              <div style={{ 
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                width: '16px',
                height: '16px',
                background: '#facc15',
                borderRadius: '50%',
                border: '2px solid white'
              }}></div>
              <div style={{ 
                position: 'absolute',
                bottom: '-8px',
                left: '-8px',
                width: '12px',
                height: '12px',
                background: '#f87171',
                borderRadius: '50%',
                border: '1px solid white'
              }}></div>
            </div>
          </div>
        </div>
        
        {/* Welcome Text */}
        <div>
          <h1 style={{
            fontSize: '36px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #2563eb, #059669)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '16px',
            lineHeight: '1.2'
          }}>
            Welcome Back
          </h1>
          <p style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: '#6b7280',
            marginBottom: '8px'
          }}>
            Bureau of Local Government Finance
          </p>
          <p style={{ 
            fontSize: '16px', 
            fontWeight: '500', 
            color: '#9ca3af'
          }}>
            CARAGA Administrative Region
          </p>
        </div>
      </div>

      {/* Premium Glass Card */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '32px',
        padding: '40px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background Pattern */}
        <div style={{
          position: 'absolute',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(16, 185, 129, 0.05))',
          pointerEvents: 'none'
        }}></div>
        
        <div style={{ position: 'relative', zIndex: '10' }}>
          {/* Error Display */}
          {error && (
            <div style={{
              padding: '16px',
              borderRadius: '16px',
              background: '#fef2f2',
              border: '2px solid #fca5a5',
              color: '#dc2626',
              marginBottom: '24px',
              animation: 'shake 0.5s ease-in-out'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  width: '24px',
                  height: '24px',
                  background: '#ef4444',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg style={{ width: '14px', height: '14px', color: 'white' }} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                </div>
                <span style={{ fontWeight: '600', fontSize: '16px' }}>{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Email Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                color: '#374751',
                marginBottom: '8px'
              }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '16px 16px 16px 48px',
                    fontSize: '16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '16px',
                    background: 'rgba(255, 255, 255, 0.8)',
                    transition: 'all 0.3s ease',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.background = 'white';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.background = 'rgba(255, 255, 255, 0.8)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <div style={{ 
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '20px',
                  height: '20px',
                  color: '#9ca3af'
                }}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Password Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                color: '#374751',
                marginBottom: '8px'
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '16px 48px 16px 48px',
                    fontSize: '16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '16px',
                    background: 'rgba(255, 255, 255, 0.8)',
                    transition: 'all 0.3s ease',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.background = 'white';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.background = 'rgba(255, 255, 255, 0.8)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <div style={{ 
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '20px',
                  height: '20px',
                  color: '#9ca3af'
                }}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                  </svg>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ 
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '20px',
                    height: '20px',
                    color: '#9ca3af',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => e.target.style.color = '#6b7280'}
                  onMouseLeave={(e) => e.target.style.color = '#9ca3af'}
                >
                  {showPassword ? (
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '20px', height: '20px' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"/>
                    </svg>
                  ) : (
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '20px', height: '20px' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              padding: '8px 0'
            }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                cursor: 'pointer'
              }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ display: 'none' }}
                  />
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '6px',
                    border: '2px solid ' + (rememberMe ? '#3b82f6' : '#d1d5db'),
                    background: rememberMe ? '#3b82f6' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}>
                    {rememberMe && (
                      <svg style={{ width: '12px', height: '12px', color: 'white' }} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                    )}
                  </div>
                </div>
                <span style={{ 
                  fontSize: '16px', 
                  fontWeight: '500', 
                  color: '#6b7280'
                }}>
                  Remember me
                </span>
              </label>
              
              <button 
                type="button" 
                style={{ 
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#3b82f6',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.color = '#1d4ed8'}
                onMouseLeave={(e) => e.target.style.color = '#3b82f6'}
              >
                Forgot password?
              </button>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '18px',
                fontSize: '18px',
                fontWeight: '600',
                color: 'white',
                background: 'linear-gradient(135deg, #3b82f6, #059669)',
                border: 'none',
                borderRadius: '16px',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                opacity: loading ? '0.7' : '1',
                transform: 'translateY(0)',
                fontFamily: 'inherit'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.background = 'linear-gradient(135deg, #1d4ed8, #047857)';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.background = 'linear-gradient(135deg, #3b82f6, #059669)';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                }
              }}
            >
              {loading ? (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: '12px'
                }}>
                  <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
                  </svg>
                  <span>Sign In</span>
                </div>
              )}
            </button>
          </form>
        </div>
      </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center" style={{ padding: '2rem 0' }}>
            <div 
              style={{
                width: '100%',
                height: '1px',
                background: 'linear-gradient(to right, transparent, #d1d5db, transparent)'
              }}
            ></div>
            <div 
              className="absolute font-medium"
              style={{ 
                padding: '0 1.5rem',
                background: 'rgba(255, 255, 255, 0.95)',
                color: '#6b7280',
                fontSize: '16px'
              }}
            >
              or continue with
            </div>
          </div>

          {/* Social Login Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button 
              className="w-full border-2 font-semibold rounded-2xl transition-all duration-300 transform shadow-sm group" 
              style={{
                padding: '1rem',
                background: 'white',
                borderColor: '#e5e7eb',
                color: '#374151',
                fontSize: '16px'
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = '#f87171';
                e.target.style.color = '#dc2626';
                e.target.style.background = '#fef2f2';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.color = '#374151';
                e.target.style.background = 'white';
                e.target.style.transform = 'translateY(0)';
              }}
              disabled={loading}
            >
              <div className="flex items-center justify-center" style={{ gap: '0.75rem' }}>
                <svg className="transition-transform duration-200 group-hover:scale-110" style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Continue with Google</span>
              </div>
            </button>
            
            <button 
              className="w-full border-2 font-semibold rounded-2xl transition-all duration-300 transform shadow-sm group" 
              style={{
                padding: '1rem',
                background: 'white',
                borderColor: '#e5e7eb',
                color: '#374151',
                fontSize: '16px'
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = '#60a5fa';
                e.target.style.color = '#2563eb';
                e.target.style.background = '#eff6ff';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.color = '#374151';
                e.target.style.background = 'white';
                e.target.style.transform = 'translateY(0)';
              }}
              disabled={loading}
            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '18px',
                fontSize: '18px',
                fontWeight: '600',
                color: 'white',
                background: 'linear-gradient(135deg, #3b82f6, #059669)',
                border: 'none',
                borderRadius: '16px',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                opacity: loading ? '0.7' : '1',
                transform: 'translateY(0)',
                fontFamily: 'inherit'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.background = 'linear-gradient(135deg, #1d4ed8, #047857)';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.background = 'linear-gradient(135deg, #3b82f6, #059669)';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                }
              }}
            >
              {loading ? (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: '12px'
                }}>
                  <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
                  </svg>
                  <span>Sign In</span>
                </div>
              )}
            </button>
          </form>

          {/* Divider */}
          <div style={{ 
            position: 'relative', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '32px 0'
          }}>
            <div style={{
              width: '100%',
              height: '1px',
              background: 'linear-gradient(to right, transparent, #d1d5db, transparent)'
            }}></div>
            <div style={{ 
              position: 'absolute',
              padding: '0 24px',
              background: 'rgba(255, 255, 255, 0.95)',
              color: '#6b7280',
              fontSize: '16px',
              fontWeight: '500'
            }}>
              or continue with
            </div>
          </div>

          {/* Social Login Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <button 
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px',
                background: 'white',
                border: '2px solid #e5e7eb',
                borderRadius: '16px',
                color: '#374151',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                fontFamily: 'inherit'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.borderColor = '#f87171';
                  e.target.style.color = '#dc2626';
                  e.target.style.background = '#fef2f2';
                  e.target.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.color = '#374151';
                  e.target.style.background = 'white';
                  e.target.style.transform = 'translateY(0)';
                }
              }}
            >
              <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Continue with Google</span>
            </button>
            
            <button 
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px',
                background: 'white',
                border: '2px solid #e5e7eb',
                borderRadius: '16px',
                color: '#374151',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                fontFamily: 'inherit'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.borderColor = '#60a5fa';
                  e.target.style.color = '#2563eb';
                  e.target.style.background = '#eff6ff';
                  e.target.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.color = '#374151';
                  e.target.style.background = 'white';
                  e.target.style.transform = 'translateY(0)';
                }
              }}
            >
              <svg style={{ width: '20px', height: '20px' }} fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.15 2.587L18.21.21a1.494 1.494 0 0 0-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 0 0-1.276.057L.327 7.261A1 1 0 0 0 .326 8.74L3.899 12 .326 15.26a1 1 0 0 0 .001 1.479L1.65 17.94a.999.999 0 0 0 1.276.057l4.12-3.128 9.46 8.63a1.492 1.492 0 0 0 1.704.29l4.942-2.377A1.5 1.5 0 0 0 24 20.06V3.939a1.5 1.5 0 0 0-.85-1.352z"/>
              </svg>
              <span>Continue with Microsoft</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        textAlign: 'center',
        padding: '32px',
        background: 'rgba(255, 255, 255, 0.6)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '24px',
        marginTop: '24px'
      }}>
        <p style={{ 
          color: '#6b7280', 
          fontSize: '16px', 
          marginBottom: '16px'
        }}>
          Don't have an account?{" "}
          <button
            type="button"
            onClick={() => {
              onClose();
              onRequestAccess();
            }}
            style={{ 
              color: '#3b82f6',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              fontFamily: 'inherit'
            }}
            onMouseEnter={(e) => e.target.style.color = '#1d4ed8'}
            onMouseLeave={(e) => e.target.style.color = '#3b82f6'}
          >
            Request Access
          </button>
        </p>
        <p style={{ 
          color: '#9ca3af', 
          fontSize: '14px'
        }}>
          © 2025 Bureau of Local Government Finance - CARAGA Region
        </p>
      </div>

      {/* Add CSS for animations */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
}