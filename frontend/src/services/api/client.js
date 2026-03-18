import axios from "axios";
import { useAuthStore } from "../../store/authStore";

const baseURL = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

export const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 15000
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise = null;

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = api
      .post("/api/auth/refresh")
      .then((res) => {
        const { accessToken, user } = res.data || {};
        if (accessToken) {
          useAuthStore.getState().setSession({ accessToken, user });
        }
        return accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const status = err?.response?.status;
    const original = err?.config;

    if (status === 401 && original && !original.__isRetry) {
      original.__isRetry = true;
      try {
        const newToken = await refreshAccessToken();
        if (newToken) {
          original.headers = original.headers || {};
          original.headers.Authorization = `Bearer ${newToken}`;
          return api.request(original);
        }
      } catch (e) {
        // fall through
      }

      useAuthStore.getState().clear();
    }

    throw err;
  }
);
