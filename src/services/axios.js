import axios from "axios";

// Simple in-memory cache for GET requests
const requestCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

let notificationHandler = null;
let unauthorizedErrorShown = false;

export const setNotificationHandler = (handler) => {
  notificationHandler = handler;
};

export const resetUnauthorizedErrorFlag = () => {
  unauthorizedErrorShown = false;
};

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
});

// Helper: Refresh token
const refreshToken = async () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (!user?.refreshToken) throw new Error("No refresh token available");

  const response = await api.post("/auth/refresh-token", {
    refreshToken: user.refreshToken,
  });

  const newUser = { ...user, token: response.data.token };
  localStorage.setItem("user", JSON.stringify(newUser));
  return newUser;
};

// Axios request interceptor
api.interceptors.request.use((config) => {
  // Skip auth logic for login/logout (public endpoints)
  if (config.url.includes("/auth/login") || config.url.includes("/auth/logout")) {
    return config;
  }

  const user = localStorage.getItem("user");
  const isAIEndpoint = config.url?.includes("/free-stream-ai");

  // 1️⃣ AI API Key for AI endpoints
  if (isAIEndpoint) {
    config.headers["Authorization"] = "sk-297a7af14b3748c7abeff952989a8468";
  } 
  // 2️⃣ JWT Token
  else if (user) {
    try {
      const userData = JSON.parse(user);
      if (userData.token) {
        config.headers["Authorization"] = `Bearer ${userData.token}`;
      } else {
        // fallback to body auth for protected endpoints
        config.data = { ...(config.data || {}), 
          username: userData.username,
          role: userData.role,
          clientId: userData.clientId,
        };
      }

      if (config.data instanceof FormData) delete config.headers["Content-Type"];
    } catch (e) {
      console.error("[axios] Error setting auth header:", e);
    }
  } 
  // 3️⃣ Guest fallback
  else {
    config.data = { ...(config.data || {}), 
      username: "guest",
      role: "guest",
      clientId: "guest",
    };
  }

  // Cache GET requests
  if (config.method === "get") {
    const cacheKey = `${config.url}?${new URLSearchParams(config.params).toString()}`;
    const cached = requestCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return Promise.resolve({
        data: cached.data,
        status: 200,
        statusText: "OK (Cached)",
        headers: {},
        config,
        cached: true,
      });
    }
  }

  return config;
});

// Axios response interceptor with refresh token logic
let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => refreshSubscribers.push(cb);
const onRefreshed = (newToken) => {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
};

api.interceptors.response.use(
  (response) => {
    // Cache GET requests
    if (response.config.method === "get" && response.status === 200 && !response.cached) {
      const cacheKey = `${response.config.url}?${new URLSearchParams(response.config.params).toString()}`;
      requestCache.set(cacheKey, { data: response.data, timestamp: Date.now() });
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error?.response?.status === 401) {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const isUnauthorized = error.response.data?.message?.includes("Unauthorized");

      if (isUnauthorized && user?.refreshToken && !originalRequest._retry) {
        if (isRefreshing) {
          // Queue request while refreshing
          return new Promise((resolve) => {
            subscribeTokenRefresh((token) => {
              originalRequest.headers["Authorization"] = `Bearer ${token}`;
              resolve(api(originalRequest));
            });
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const newUser = await refreshToken();
          originalRequest.headers["Authorization"] = `Bearer ${newUser.token}`;
          onRefreshed(newUser.token);
          return api(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem("user"); // Optional: log out user
          if (!unauthorizedErrorShown && notificationHandler) {
            unauthorizedErrorShown = true;
            notificationHandler.showUnauthorizedError("Session expired – please login again.");
          }
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      if (!unauthorizedErrorShown && notificationHandler) {
        unauthorizedErrorShown = true;
        notificationHandler.showUnauthorizedError(
          "Unauthorized – Please login to continue."
        );
      }
    }

    return Promise.reject(error);
  }
);

// Cache utilities
export const clearCache = () => requestCache.clear();
export const invalidateCache = (pattern) => {
  for (const key of requestCache.keys()) if (key.includes(pattern)) requestCache.delete(key);
};

export default api;
