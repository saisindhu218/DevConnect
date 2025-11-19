import axios from "axios";

export const BASE_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

/**
 * Normal axios instance — used for public requests
 */
const axiosPublic = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

/**
 * Private axios instance for authenticated requests
 * TOKEN IS INJECTED FROM AuthContext (via localStorage or setAuth)
 */
export const axiosPrivate = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Ensure requests carry the Authorization header if a token exists in localStorage.
 * This helps when the page is reloaded and axiosPrivate.defaults hasn't been set yet.
 */
axiosPrivate.interceptors.request.use(
  (config) => {
    try {
      const storedToken = localStorage.getItem("accessToken");
      if (storedToken && !config.headers?.Authorization) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${storedToken}`,
        };
      }
    } catch (e) {
      // ignore storage errors
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response Interceptor — TRY REFRESH once on 401
 * Note: We use axiosPublic to call /auth/refresh (cookie-based refresh).
 * After successfully getting a new access token, retry the original request.
 */
axiosPrivate.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only try once per request
    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;
      try {
        // Attempt cookie-based refresh
        const refreshResp = await axiosPublic.get("/auth/refresh", {
          withCredentials: true,
        });

        const newToken = refreshResp.data?.accessToken;
        if (newToken) {
          // Persist to localStorage and update axios headers
          try {
            localStorage.setItem("accessToken", newToken);
          } catch (e) {
            // ignore storage errors
          }
          axiosPrivate.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
          originalRequest.headers["Authorization"] = `Bearer ${newToken}`;

          return axiosPrivate(originalRequest);
        }
      } catch (refreshErr) {
        // Refresh failed — let AuthContext handle logout/cleanup
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosPublic;
