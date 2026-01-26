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
        <div className="fixed inset-0 bg-base-300/80 backdrop-blur-sm flex items-center justify-center z-[1000] p-4 font-sans transition-all duration-300">
            {/* Modal Card Container */}
            <div className="relative w-full max-w-lg bg-base-100 rounded-3xl shadow-2xl border border-base-200 overflow-hidden transform transition-all">

                {/* Decorative Top Bar */}
                <div className="h-2 w-full bg-gradient-to-r from-primary to-secondary"></div>

                <div className="p-8 sm:p-10 relative">
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 btn btn-circle btn-ghost btn-sm text-base-content/40 hover:bg-base-200 hover:text-base-content transition-colors"
                    >
                        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-24 h-24 mb-6 bg-transparent">
                            <img
                                src="https://blgf.gov.ph/wp-content/uploads/2022/05/BLGF-Seal-Regular.png"
                                alt="BLGF Logo"
                                className="w-full h-full object-contain drop-shadow-md"
                            />
                        </div>
                        <h1 className="text-3xl font-bold text-base-content tracking-tight">
                            Create Account
                        </h1>
                        <p className="text-sm text-base-content/60 mt-1">
                            Join the BLGF XIII Portal today.
                        </p>
                    </div>

                    {error && (
                        <div className="alert alert-error text-sm py-3 mb-6 shadow-sm rounded-xl">
                            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="form-control">
                                <label className="label pt-0"><span className="label-text font-medium text-base-content/80">First Name</span></label>
                                <input
                                    type="text"
                                    name="firstName"
                                    placeholder="John"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                    className="input input-bordered w-full rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 bg-base-200/50 hover:bg-base-200 transition-all font-medium"
                                />
                            </div>
                            <div className="form-control">
                                <label className="label pt-0"><span className="label-text font-medium text-base-content/80">Last Name</span></label>
                                <input
                                    type="text"
                                    name="lastName"
                                    placeholder="Doe"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                    className="input input-bordered w-full rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 bg-base-200/50 hover:bg-base-200 transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div className="form-control">
                            <label className="label pt-0"><span className="label-text font-medium text-base-content/80">Region</span></label>
                            <input
                                type="text"
                                name="region"
                                placeholder="Region (e.g. Region XIII)"
                                value={formData.region}
                                onChange={handleChange}
                                required
                                className="input input-bordered w-full rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 bg-base-200/50 hover:bg-base-200 transition-all"
                            />
                        </div>

                        <div className="form-control">
                            <label className="label pt-0"><span className="label-text font-medium text-base-content/80">Email Address</span></label>
                            <input
                                type="email"
                                name="email"
                                placeholder="name@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="input input-bordered w-full rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 bg-base-200/50 hover:bg-base-200 transition-all"
                            />
                        </div>

                        <div className="form-control">
                            <label className="label pt-0"><span className="label-text font-medium text-base-content/80">Password</span></label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="Min 6 characters"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    minLength={6}
                                    className="input input-bordered w-full rounded-xl pr-12 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-base-200/50 hover:bg-base-200 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 btn btn-ghost btn-circle btn-xs text-base-content/40 hover:text-base-content"
                                >
                                    {showPassword ? (
                                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                                            <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                                        </svg>
                                    ) : (
                                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`btn btn-primary w-full rounded-xl text-lg font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 border-none mt-4 transition-all`}
                        >
                            {loading ? <span className="loading loading-spinner loading-sm"></span> : "Sign Up"}
                        </button>
                    </form>

                    <div className="text-center mt-6 pt-4 border-t border-base-200">
                        <p className="text-sm text-base-content/60">
                            Already have an account?{' '}
                            <button
                                type="button"
                                onClick={onGoToLogin}
                                className="text-primary font-bold hover:underline cursor-pointer"
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
