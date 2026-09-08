import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// Intercept all requests and attach Clerk JWT token for @clerk/express authentication
// window.Clerk is the official singleton available after Clerk initializes
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      // Try window.Clerk first (available once ClerkProvider mounts)
      const clerkSession = window?.Clerk?.session;
      if (clerkSession) {
        const token = await clerkSession.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (error) {
      console.warn("Could not attach Clerk auth token:", error.message);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
