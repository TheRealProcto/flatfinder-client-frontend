import axios from "axios";

/**
 * Instância central do axios (API client)
 * - baseURL vem do .env (VITE_API_URL)
 * - interceptor injeta JWT automaticamente
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
