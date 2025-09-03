import axios from "axios";

const BASE_URL = import.meta.env.MODE === "development"
  ? import.meta.env.VITE_CLIENT_API_URL_LOCAL
  : import.meta.env.VITE_CLIENT_API_URL;

const api = axios.create({
  baseURL: BASE_URL,
});

export default api;