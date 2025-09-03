import axios from "axios";

const BASE_URL = import.meta.env.MODE === "development"
  ? import.meta.env.VITE_CLIENT_API_URL_LOCAL
  : "/api";

const api = axios.create({
  baseURL: BASE_URL,
});

export default api;