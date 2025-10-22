import axios from 'axios';

// Create axios instance with base configuration
const axiosInstance = axios.create({
  baseURL: 'http://localhost:4000/api/v1',
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add access token to requests
axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('token');
    if (accessToken) {
      console.log("🔑 Adding token to request:", accessToken.substring(0, 20) + "...");
      config.headers.Authorization = `Bearer ${accessToken}`;
    } else {
      console.log("❌ No token found in localStorage");
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh on 401 errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    console.log("🚨 Response error:", error.response?.status, error.response?.data);
    console.log("🚨 Full error object:", error);

    // Check if error is 401 (Unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log("🔄 Attempting token refresh...");
      originalRequest._retry = true; // Prevent infinite loops

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          console.log("❌ No refresh token available, logging out");
          // No refresh token available, logout user
          handleLogout();
          return Promise.reject(error);
        }

        console.log("🔄 Refresh token found, calling refresh endpoint...");

        // Attempt to refresh the token
        const response = await axiosInstance.post('/auth/refresh-token', { 
          refreshToken 
        });

        console.log("✅ Refresh token response:", response.data);

        const { accessToken: newAccessToken } = response.data;
        
        if (!newAccessToken) {
          console.error('No access token in refresh response:', response.data);
          handleLogout();
          return Promise.reject(error);
        }

        console.log("✅ New access token received, updating localStorage and retrying request");

        // Update token in localStorage
        localStorage.setItem('token', newAccessToken);

        // Update the Authorization header for the original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // Retry the original request
        return axiosInstance(originalRequest);

      } catch (refreshError) {
        // Refresh token failed, logout user
        console.error('❌ Token refresh failed:', refreshError.response?.data || refreshError.message);
        handleLogout();
        return Promise.reject(refreshError);
      }
    }

    // If it's a 401 with retry flag set, or any other error, just reject
    return Promise.reject(error);
  }
);

// Logout handler - clear localStorage and redirect
const handleLogout = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  
  // Redirect to login page
  window.location.href = '/login';
};

export default axiosInstance;
