import axios from "axios";

export default function useApi() {
  // Determine API base URL
  const API_BASE_URL =
    import.meta.env.MODE === "production"
      ? "http://localhost:5001/api"
      : "/api";

  // Create axios instance
  const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 100000,
    headers: { "Content-Type": "application/json" },
  });

  // Add token automatically if available
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  // -------------------
  // Helper functions
  // -------------------

  // --- Users ---
  const getAllUsers = () => api.get("/users");
  const registerUser = (data) => api.post("/users/register", data);
  const loginUser = (data) => api.post("/users/login", data);

  // --- Assessors ---
  const getAllAssessors = (params = {}) => api.get("/assessors", { params });
  const createAssessor = (data) => api.post("/assessors", data);
  const updateAssessor = (id, data) => api.put(`/assessors/${id}`, data);
  const deleteAssessor = (id) => api.delete(`/assessors/${id}`);

  // --- LGUs ---
  const getAllLgus = (params = {}) => api.get("/lgus", { params });
  const getAllLgusNoPagination = () => api.get("/lgus", { params: { all: true } });
  const getLguById = (id) => api.get(`/lgus/${id}`);
  const createLgu = (data) => api.post("/lgus", data);
  const updateLgu = (id, data) => api.put(`/lgus/${id}`, data);
  const deleteLgu = (id) => api.delete(`/lgus/${id}`);

  // --- SMV Monitoring ---
  const getSMVProcesses = (params = {}) => api.get("/smv-processes", { params });
  const getSMVProcessById = (id) => api.get(`/smv-processes/${id}`);
  const createSMVProcess = (data) => api.post("/smv-processes", data);
  const updateSMVProcess = (id, data) => api.put(`/smv-processes/${id}`, data);
  const deleteSMVProcess = (id) => api.delete(`/smv-processes/${id}`);

  // Activities inside SMV
  const updateSMVActivity = (id, activityId, data) =>
    api.put(`/smv-processes/${id}/activities/${activityId}`, data);

  // Progress
  const getSMVProgress = (id) => api.get(`/smv-processes/${id}/progress`);

  return {
    // User
    getAllUsers,
    registerUser,
    loginUser,

    // Assessor
    getAllAssessors,
    createAssessor,
    updateAssessor,
    deleteAssessor,

    // LGU
    getAllLgus,
    getAllLgusNoPagination,
    getLguById,
    createLgu,
    updateLgu,
    deleteLgu,

    // SMV
    getSMVProcesses,
    getSMVProcessById,
    createSMVProcess,
    updateSMVProcess,
    deleteSMVProcess,
    updateSMVActivity,
    getSMVProgress,

    // Raw axios instance
    api,
  };
}
