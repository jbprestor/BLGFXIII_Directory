import axios from "axios";

let baseURL = "http://localhost:5001"; // default to local

try {
  // Optionally ping localhost here or just attempt request
  // If fails, fallback to remote
  baseURL = "http://localhost:5001";
} catch {
  baseURL = "https://cuddly-xylophone-wjxpw69g425pg7-5001.app.github.dev";
}

const api = axios.create({
  baseURL,
});

export default api;
