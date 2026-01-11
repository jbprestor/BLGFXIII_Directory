import { useState, useMemo } from "react";
import useApi from "../../../services/axios.js";
import { toast } from "react-hot-toast";

export default function UserRegisterModal({ onClose, onGoToLogin }) {
    const api = useApi();
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        role: "Municipal", // Default role
        region: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // Region options (could be fetched, but hardcoding for now based on context)
    const REGIONS = [
        "region_i", "region_ii", "region_iii", "region_iv_a", "region_iv_b",
        "region_v", "region_vi", "region_vii", "region_viii", "region_ix",
        "region_x", "region_xi", "region_xii", "region_xiii", "ncr", "car", "barmm"
    ].map(r => r.toUpperCase()); // Simple normalization

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await api.registerUser(formData);
            toast.success("Account created successfully! Please login.");
            onGoToLogin();
        } catch (err) {
            console.error("Registration error:", err);
            setError(err.response?.data?.message || "Failed to create account. Please try again.");
        } finally {
            setLoading(false);
        }
    };

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
            <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '20px',
                width: '90%',
                maxWidth: '500px',
                margin: '20px',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
                position: 'relative',
                overflowY: 'auto',
                maxHeight: '90vh'
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
                    background: 'white',
                    borderRadius: '20px',
                    margin: '4px',
                    padding: '40px',
                    position: 'relative'
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
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                        <h1 style={{ fontSize: '28px', fontWeight: '600', color: '#2d3748', margin: '0 0 8px 0' }}>
                            Create Account
                        </h1>
                        <p style={{ fontSize: '14px', color: '#718096', margin: '0' }}>
                            Join the BLGF XIII Portal today.
                        </p>
                    </div>

                    {error && (
                        <div style={{
                            background: '#fed7d7',
                            border: '1px solid #fc8181',
                            borderRadius: '8px',
                            padding: '12px',
                            marginBottom: '20px',
                            color: '#c53030',
                            fontSize: '14px',
                            textAlign: 'center'
                        }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                            <input
                                type="text"
                                name="firstName"
                                placeholder="First Name"
                                value={formData.firstName}
                                onChange={handleChange}
                                required
                                style={{
                                    width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none'
                                }}
                            />
                            <input
                                type="text"
                                name="lastName"
                                placeholder="Last Name"
                                value={formData.lastName}
                                onChange={handleChange}
                                required
                                style={{
                                    width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none'
                                }}
                            />
                        </div>

                        <input
                            type="text"
                            name="region"
                            placeholder="Region (e.g. Region XIII)"
                            value={formData.region}
                            onChange={handleChange}
                            required
                            style={{
                                width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none'
                            }}
                        />

                        <input
                            type="email"
                            name="email"
                            placeholder="Email Address"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            style={{
                                width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none'
                            }}
                        />

                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                minLength={6}
                                style={{
                                    width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none'
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                                    background: 'none', border: 'none', cursor: 'pointer', color: '#a0aec0'
                                }}
                            >
                                {showPassword ? "Hide" : "Show"}
                            </button>
                        </div>

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
                                opacity: loading ? 0.7 : 1,
                                marginTop: '10px'
                            }}
                        >
                            {loading ? "Creating Account..." : "Sign Up"}
                        </button>
                    </form>

                    <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                        <p style={{ fontSize: '14px', color: '#718096', margin: '0' }}>
                            Already have an account?{' '}
                            <button
                                type="button"
                                onClick={onGoToLogin}
                                style={{
                                    background: 'none', border: 'none', color: '#667eea',
                                    fontSize: '14px', cursor: 'pointer', fontWeight: '600'
                                }}
                            >
                                Login
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
