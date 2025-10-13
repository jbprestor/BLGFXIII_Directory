import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function UserCreateModal({
  isOpen,
  onClose,
  onCreateUser,
  loading,
}) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "Regional",
    region: "",
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        role: "Regional",
        region: "",
      });
      setErrors({});
    }
  }, [isOpen]);

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value.trim() }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName) newErrors.firstName = "First name is required";
    if (!formData.lastName) newErrors.lastName = "Last name is required";
    if (!formData.email) newErrors.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = "Invalid email format";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 8) newErrors.password = "Password must be at least 8 characters";
    if (!formData.role) newErrors.role = "Role is required";
    if (formData.role !== "Admin" && !formData.region) newErrors.region = "Region is required for this role";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the highlighted errors before submitting.");
      return;
    }

    try {
      await onCreateUser(formData);
      // Success - show pending approval message and close modal
      toast.success(`Registration submitted! ${formData.firstName} ${formData.lastName}'s account is pending approval.`, {
        duration: 5000,
      });
      onClose();
    } catch (err) {
      // Handle error with user-friendly message from backend
      const errorMessage = err.response?.data?.message || err.message || "Failed to submit registration. Please try again.";
      toast.error(errorMessage);
    }
  };

  if (!isOpen) return null;

  const roleOptions = [
    { value: "Regional", label: "Regional" },
    { value: "Provincial", label: "Provincial" },
    { value: "Municipal", label: "Municipal" },
    { value: "Admin", label: "Admin" },
  ];

  const regionOptions = [
    { value: "", label: "Select Region" },
    { value: "Region XIII", label: "Region XIII (Caraga)" },
    { value: "Region XI", label: "Region XI (Davao)" },
    { value: "Region XII", label: "Region XII (SOCCSKSARGEN)" },
  ];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Create User Card */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '20px',
        padding: '0',
        width: '100%',
        maxWidth: '500px',
        margin: '20px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background Design Elements */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '-20%',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          pointerEvents: 'none'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '-30%',
          left: '-15%',
          width: '150px',
          height: '150px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.05)',
          pointerEvents: 'none'
        }}></div>

        {/* White Content Area */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          margin: '4px',
          padding: '40px',
          position: 'relative',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}>
          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#a0aec0',
              padding: '4px',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#f7fafc';
              e.target.style.color = '#2d3748';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'none';
              e.target.style.color = '#a0aec0';
            }}
          >
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
          </button>

          {/* Header */}
          <div style={{
            textAlign: 'center',
            marginBottom: '30px'
          }}>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '600',
              color: '#2d3748',
              margin: '0',
              marginBottom: '8px'
            }}>
              Create Account
            </h1>
            <p style={{
              fontSize: '14px',
              color: '#718096',
              margin: '0'
            }}>
              Your account will be pending approval after submission.
            </p>
          </div>

          {/* Error Display */}
          {Object.keys(errors).length > 0 && (
            <div style={{
              background: '#fed7d7',
              border: '1px solid #fc8181',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '20px',
              color: '#c53030',
              fontSize: '14px'
            }}>
              Please fix the errors below before submitting.
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Name Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#2d3748', marginBottom: '6px' }}>
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: errors.firstName ? '2px solid #fc8181' : '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '16px',
                    color: '#2d3748',
                    outline: 'none',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    if (!errors.firstName) {
                      e.target.style.borderColor = '#667eea';
                      e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                    }
                  }}
                  onBlur={(e) => {
                    if (!errors.firstName) {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.boxShadow = 'none';
                    }
                  }}
                />
                {errors.firstName && (
                  <p style={{ color: '#fc8181', fontSize: '12px', marginTop: '4px', margin: '4px 0 0 0' }}>
                    {errors.firstName}
                  </p>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#2d3748', marginBottom: '6px' }}>
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: errors.lastName ? '2px solid #fc8181' : '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '16px',
                    color: '#2d3748',
                    outline: 'none',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    if (!errors.lastName) {
                      e.target.style.borderColor = '#667eea';
                      e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                    }
                  }}
                  onBlur={(e) => {
                    if (!errors.lastName) {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.boxShadow = 'none';
                    }
                  }}
                />
                {errors.lastName && (
                  <p style={{ color: '#fc8181', fontSize: '12px', marginTop: '4px', margin: '4px 0 0 0' }}>
                    {errors.lastName}
                  </p>
                )}
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#2d3748', marginBottom: '6px' }}>
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  border: errors.email ? '2px solid #fc8181' : 'none',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #fbb6ce 0%, #f687b3 100%)',
                  fontSize: '16px',
                  color: 'white',
                  outline: 'none',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #f687b3 0%, #ed64a6 100%)';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 25px rgba(244, 114, 182, 0.3)';
                }}
                onBlur={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #fbb6ce 0%, #f687b3 100%)';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              />
              {errors.email && (
                <p style={{ color: '#fc8181', fontSize: '12px', marginTop: '4px', margin: '4px 0 0 0' }}>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Input */}
            <div style={{ position: 'relative' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#2d3748', marginBottom: '6px' }}>
                Password *
              </label>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '16px 50px 16px 20px',
                  border: errors.password ? '2px solid #fc8181' : 'none',
                  borderRadius: '12px',
                  background: '#f7fafc',
                  fontSize: '16px',
                  color: '#2d3748',
                  outline: 'none',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.target.style.background = 'white';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.background = '#f7fafc';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '16px',
                  top: '32px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#a0aec0',
                  padding: '4px'
                }}
              >
                {showPassword ? (
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd"/>
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                  </svg>
                )}
              </button>
              {errors.password && (
                <p style={{ color: '#fc8181', fontSize: '12px', marginTop: '4px', margin: '4px 0 0 0' }}>
                  {errors.password}
                </p>
              )}
            </div>

            {/* Role and Region */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#2d3748', marginBottom: '6px' }}>
                  Role *
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: errors.role ? '2px solid #fc8181' : '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '16px',
                    color: '#2d3748',
                    outline: 'none',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    transition: 'all 0.3s ease',
                    background: 'white'
                  }}
                >
                  {roleOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.role && (
                  <p style={{ color: '#fc8181', fontSize: '12px', marginTop: '4px', margin: '4px 0 0 0' }}>
                    {errors.role}
                  </p>
                )}
              </div>

              {formData.role !== "Admin" && (
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#2d3748', marginBottom: '6px' }}>
                    Region *
                  </label>
                  <select
                    name="region"
                    value={formData.region}
                    onChange={handleInputChange}
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: errors.region ? '2px solid #fc8181' : '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '16px',
                      color: '#2d3748',
                      outline: 'none',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                      transition: 'all 0.3s ease',
                      background: 'white'
                    }}
                  >
                    {regionOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.region && (
                    <p style={{ color: '#fc8181', fontSize: '12px', marginTop: '4px', margin: '4px 0 0 0' }}>
                      {errors.region}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px',
                border: 'none',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                marginTop: '10px',
                fontFamily: 'inherit',
                opacity: loading ? 0.7 : 1
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }
              }}
            >
              {loading ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  Submitting...
                </div>
              ) : (
                'Submit Registration'
              )}
            </button>
          </form>

          {/* Footer Info */}
          <div style={{
            textAlign: 'center',
            marginTop: '30px',
            paddingTop: '20px',
            borderTop: '1px solid #e2e8f0'
          }}>
            <p style={{
              fontSize: '12px',
              color: '#718096',
              margin: '0'
            }}>
              Your account will be reviewed by an administrator before activation.
            </p>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
