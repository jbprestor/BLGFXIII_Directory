/* eslint-disable react-refresh/only-export-components */
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
    if (token && userData && userData !== "undefined") {
      try {
        setUser(JSON.parse(userData)); // restore user from localStorage
      } catch (e) {
        console.error("Failed to parse user data from local storage", e);
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  // Inactivity Auto-Logout Effect
  useEffect(() => {
    if (!user) return;

    const INACTIVITY_LIMIT = 12 * 60 * 60 * 1000; // 12 hours in milliseconds
    let isLoggedOut = false;

    const updateActivity = () => {
      if (isLoggedOut) return;
      localStorage.setItem("lastActivity", Date.now().toString());
    };

    // Initialize activity on mount
    updateActivity();

    // Check inactivity periodically
    const intervalId = setInterval(() => {
      const lastActivity = localStorage.getItem("lastActivity");
      if (lastActivity && Date.now() - parseInt(lastActivity, 10) > INACTIVITY_LIMIT) {
        if (!isLoggedOut) {
          isLoggedOut = true;
          console.log("Session expired due to inactivity");
          logout();
        }
      }
    }, 60000); // Check every minute

    // Update activity on user interaction
    const events = ["mousemove", "keydown", "click", "scroll"];
    events.forEach(eventName => window.addEventListener(eventName, updateActivity));

    return () => {
      clearInterval(intervalId);
      events.forEach(eventName => window.removeEventListener(eventName, updateActivity));
    };
  }, [user]);

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

  const logout = async () => {
    try {
      // Call backend logout endpoint to invalidate session
      await api.logoutUser();
    } catch (error) {
      console.error("Error during logout:", error);
      // Continue with logout even if backend call fails
    } finally {
      // Clear local storage and user state
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      // Force full reload to homepage
      window.location.replace("/"); // replaces current history entry
    }
  };

  const updateUser = (updatedData) => {
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
