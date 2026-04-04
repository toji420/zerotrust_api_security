import axios from "axios";

const API_BASE = "http://localhost:8080/api";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const blocked = err.response?.data?.blocked;

    // User is blocked — redirect to blocked page
    if (blocked) {
      localStorage.clear();
      window.location.href = "/blocked";
      return Promise.reject(err);
    }

    if (status === 401) {
      const token = localStorage.getItem("token");

      // No token at all — genuinely not logged in
      if (!token) {
        window.location.href = "/login";
        return Promise.reject(err);
      }

      // Token exists but got 401 — only redirect if backend confirms token is dead
      const msg = (err.response?.data?.message || "").toLowerCase();
      const isTokenDead =
        msg.includes("expired") ||
        msg.includes("invalid token") ||
        msg.includes("malformed") ||
        msg.includes("jwt");

      if (isTokenDead) {
        localStorage.clear();
        window.location.href = "/login";
      }

      // Otherwise just reject — let the component handle it gracefully
      return Promise.reject(err);
    }

    // 403 — forbidden (wrong role or blocked) — NEVER redirect to login
    return Promise.reject(err);
  }
);

export const authApi = {
  login: (username, password, role) =>
    api.post("/auth/login", { username, password, role }),
  register: (data) => api.post("/auth/register", data),
  logout: () => api.post("/auth/logout"),
};

export const adminApi = {
  getDashboardStats: () => api.get("/admin/dashboard/stats"),
  getAllUsers:        () => api.get("/admin/users"),
  getBlockedUsers:   () => api.get("/admin/users/blocked"),
  blockUser:   (username, reason) => api.post(`/admin/users/${username}/block`, { reason }),
  unblockUser: (username)         => api.post(`/admin/users/${username}/unblock`),
  getThreats:       () => api.get("/admin/threats"),
  getRecentThreats: () => api.get("/admin/threats/recent"),
  getRecentLogs:    () => api.get("/admin/api-logs/recent"),
  getUserLogs: (username) => api.get(`/admin/users/${username}/logs`),
};

export const userApi = {
  getProfile:   () => api.get("/user/profile"),
  getDashboard: () => api.get("/user/dashboard"),
  getActivity:  () => api.get("/user/activity"),
  testApi:      () => api.get("/user/test-api"),
};

export default api;