import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axiosConfig';

// Create AuthContext
export const AuthContext = createContext();

// AuthProvider component
export const AuthProvider = ({ children }) => {
  // State management
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Login function
  const login = (userData, tokenData, refreshTokenData) => {
    setUser(userData);
    setToken(tokenData);
    setRefreshToken(refreshTokenData);
    setIsAuthenticated(true);
    
    // Save to localStorage
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', tokenData);
    localStorage.setItem('refreshToken', refreshTokenData);
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    setIsAuthenticated(false);
    setIsLoading(false);
    
    // Remove from localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  };

  // useEffect to check localStorage on app load and verify tokens
  useEffect(() => {
    let isInitialized = false;
    
    const initializeAuth = async () => {
      if (isInitialized) {
        console.log("🔄 Auth already initialized, skipping...");
        return;
      }
      isInitialized = true;
      const savedUser = localStorage.getItem('user');
      const savedToken = localStorage.getItem('token');
      const savedRefreshToken = localStorage.getItem('refreshToken');
      
      console.log("🔄 Initializing auth from localStorage...");
      console.log("👤 User:", savedUser ? "Found" : "Not found");
      console.log("🔑 Token:", savedToken ? "Found" : "Not found");
      console.log("🔄 Refresh Token:", savedRefreshToken ? "Found" : "Not found");
      
      if (savedUser && savedToken && savedRefreshToken) {
        try {
          // First, try to verify the current access token
          console.log("🔍 Verifying current access token...");
          const response = await api.get('/auth/protected');
          
          console.log("✅ Access token is valid, logging in automatically");
          setUser(JSON.parse(savedUser));
          setToken(savedToken);
          setRefreshToken(savedRefreshToken);
          setIsAuthenticated(true);
          setIsLoading(false);
        } catch (error) {
          console.log("❌ Access token verification failed:", error.response?.status);
          
          if (error.response?.status === 401) {
            console.log("❌ Access token expired, attempting refresh...");
            // Try to refresh the token
            try {
              const refreshResponse = await api.post('/auth/refresh-token', { 
                refreshToken: savedRefreshToken 
              });
              
              console.log("✅ Token refreshed successfully");
              setUser(JSON.parse(savedUser));
              setToken(refreshResponse.data.accessToken);
              setRefreshToken(savedRefreshToken);
              setIsAuthenticated(true);
              setIsLoading(false);
              localStorage.setItem('token', refreshResponse.data.accessToken);
            } catch (refreshError) {
              console.log("❌ Refresh token error:", refreshError.response?.data || refreshError.message);
              logout();
            }
          } else {
            // If it's a connection error, just use the stored tokens without verification
            if (error.code === 'ERR_NETWORK' || error.message.includes('ERR_CONNECTION_REFUSED')) {
              console.log("🔄 Backend not available, using stored tokens without verification");
              setUser(JSON.parse(savedUser));
              setToken(savedToken);
              setRefreshToken(savedRefreshToken);
              setIsAuthenticated(true);
              setIsLoading(false);
            } else {
              console.log("❌ Unknown error, logging out");
              logout();
            }
          }
        }
      } else {
        // No tokens found, user not authenticated
        console.log("❌ No tokens found, user not authenticated");
        setIsLoading(false);
      }
    };
    
    initializeAuth();
  }, []);

  // Context value
  const value = {
    user,
    token,
    refreshToken,
    isAuthenticated,
    isLoading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
