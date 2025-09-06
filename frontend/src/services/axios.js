// services/api.js
import axios from "axios";

export default function useApi() {
  const API_BASE_URL =
    import.meta.env.MODE === "development"
      ? "http://localhost:5001/api"
      : import.meta.env.VITE_API_BASE_URL || "/api";

  const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000, // Add timeout
    headers: {
      "Content-Type": "application/json",
    },
  });

  return {
    registerUser: (data) => api.post("/users/register", data),
    loginUser: (data) => api.post("/users/login", data),
    getAllUsers: () => api.get("/users"),
    api,
  };
}
