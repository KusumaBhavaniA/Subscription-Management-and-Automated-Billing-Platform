import axios from "axios";
import { STORAGE_KEYS, getItem } from "../../utils/storage";

export const apiClient = axios.create({
  baseURL: "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});


// Attach JWT token automatically
apiClient.interceptors.request.use(
  (config) => {
    const session = getItem<any>(STORAGE_KEYS.AUTH, null);

    if (session?.token) {
      config.headers.Authorization = `Bearer ${session.token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


// Handle expired token
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {

    if (error.response?.status === 401) {
      localStorage.removeItem(STORAGE_KEYS.AUTH);
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);