import { createContext, useState, useContext, useEffect } from "react";
import useApi from "../services/axios.js";
const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const api = useApi();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (token && userData) {
      setUser(JSON.parse(userData)); // restore user from localStorage
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      // use the helper function
      const res = await api.loginUser({ email, password });

      const { token, user } = res.data; // matches controller
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      setUser(user);

      return { success: true, user, token };
    } catch (err) {
      console.error("Login error:", err.response?.data || err);
      return {
        success: false,
        message: err.response?.data?.message || "Login failed",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    // Force full reload to homepage
    window.location.replace("/"); // replaces current history entry
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
