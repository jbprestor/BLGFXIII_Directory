import axios from "axios";

let _cachedApi = null;

export default function useApi() {
  if (_cachedApi) return _cachedApi;
  // Determine API base URL
  const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    (import.meta.env.MODE === "development"
      ? "http://localhost:5001/api"
      : "/api");

  // Create axios instance
  const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 100000,
    headers: { "Content-Type": "application/json" },
  });

  // Add token automatically if available
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    // Define public endpoints that don't require authentication
    const publicEndpoints = ['/users/register', '/users/login'];
    const isPublicEndpoint = publicEndpoints.some(endpoint => config.url.includes(endpoint));

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // Only log in development mode and don't expose the actual token
      if (import.meta.env.MODE === "development") {
        // console.log("Token added to request: [REDACTED]");
      }
    } else if (!isPublicEndpoint) {
      // Only warn about missing token for protected endpoints
      if (import.meta.env.MODE === "development") {
        // console.warn("No token found in localStorage");
      }
    }
    return config;
  });

  // Handle response errors
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        console.error("Authentication failed - token may be expired");
        // Optionally clear invalid token
        // localStorage.removeItem("token");
        // localStorage.removeItem("user");
      }
      return Promise.reject(error);
    }
  );

  // -------------------
  // Helper functions
  // -------------------

  // --- Users ---
  const getAllUsers = () => api.get("/users");
  const registerUser = (data) => api.post("/users/register", data);
  const loginUser = (data) => api.post("/users/login", data);
  const logoutUser = () => api.post("/auth/logout");
  const getPendingUsers = () => api.get("/users/pending");
  const updateUserStatus = (userId, status) => api.patch(`/users/${userId}/status`, { status });
  const updateProfile = (data) => api.put("/users/profile", data);
  const uploadProfilePicture = (formData) => api.post("/users/profile/picture", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  const deleteProfilePicture = () => api.delete("/users/profile/picture");

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

  // --- Cascading LGU filters ---
  const getRegions = () => api.get("/lgus/regions");
  const getProvinces = (region = null) => api.get("/lgus/provinces", { params: { region } });
  const getLGUsByProvince = (province) => api.get("/lgus/by-province", { params: { province } });

  // --- SMV Monitoring ---
  const getSMVProcesses = (params = {}) => api.get("/smv-processes", { params });
  const getSMVProcessById = (id) => api.get(`/smv-processes/${id}`);
  const createSMVProcess = (data) => api.post("/smv-processes", data);
  const updateSMVProcess = (id, data) => api.put(`/smv-processes/${id}`, data);
  const deleteSMVProcess = (id) => api.delete(`/smv-processes/${id}`);
  const updateSMVTimeline = (id, timeline) => api.patch(`/smv-processes/${id}/timeline`, { timeline }); // 🔹 Set timeline dates

  // Activities inside SMV
  const updateSMVActivity = (id, activityId, data) =>
    api.put(`/smv-processes/${id}/activities/${activityId}`, data);

  // Progress
  const getSMVProgress = (id) => api.get(`/smv-processes/${id}/progress`);

  // --- QRRPA Monitoring ---
  const getAllQrrpa = (params = {}) => api.get('/qrrpa-monitoring', { params });
  const getQrrpaById = (id) => api.get(`/qrrpa-monitoring/${id}`);
  const getQrrpaByLgu = (lguId) => api.get(`/qrrpa-monitoring/lgu/${lguId}`);
  const getQrrpaByPeriod = (period) => api.get(`/qrrpa-monitoring/period/${period}`);
  const createQrrpa = (data) => api.post('/qrrpa-monitoring', data);
  // multipart/form-data upload (expects FormData) with optional onUploadProgress callback
  const createQrrpaMultipart = (formData, onUploadProgress) => api.post('/qrrpa-monitoring', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress
  });
  const updateQrrpa = (id, data) => api.put(`/qrrpa-monitoring/${id}`, data);
  const deleteQrrpa = (id) => api.delete(`/qrrpa-monitoring/${id}`);

  const apiObj = {
    // User
    getAllUsers,
    registerUser,
    loginUser,
    logoutUser,
    getPendingUsers,
    updateUserStatus,
    updateProfile,
    uploadProfilePicture,
    deleteProfilePicture,

    // Assessor
    getAllAssessors,
    createAssessor,
    updateAssessor,
    deleteAssessor,
    getAssessorNotifications: () => api.get("/assessors/notifications"),

    // LGU
    getAllLgus,
    getAllLgusNoPagination,
    getLguById,
    createLgu,
    updateLgu,
    deleteLgu,

    // LGU Cascading Filters
    getRegions,
    getProvinces,
    getLGUsByProvince,

    // SMV
    getSMVProcesses,
    getSMVProcessById,
    createSMVProcess,
    updateSMVProcess,
    deleteSMVProcess,
    updateSMVActivity,
    getSMVProgress,
    updateSMVTimeline,

    // QRRPA
    getAllQrrpa,
    getQrrpaById,
    getQrrpaByLgu,
    getQrrpaByPeriod,
    createQrrpa,
    createQrrpaMultipart,
    updateQrrpa,
    deleteQrrpa,

    // Dashboard
    getDashboardStats: () => api.get("/dashboard/stats"),

    // Raw axios instance
    api,
  };

  // cache and return
  _cachedApi = apiObj;
  return _cachedApi;
}
