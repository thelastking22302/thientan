import React, { createContext, useState, useEffect, useContext } from 'react';
import { axiosInstance } from '../components/server'; // Import axiosInstance

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initial fetch to check for existing session using refresh token
  useEffect(() => {
    const checkAuth = async () => {
      console.log("AuthContext: Checking for existing session...");
      // Only run initial check if not already loading and user is not authenticated
      if (!loading && !currentUser) {
          console.log("AuthContext: Conditions met for initial session check.");
           setLoading(true); // Set loading before fetch
          try {
            // This will use the refresh token cookie via axiosInstance withCredentials
            // The interceptor will handle getting/refreshing access token
            const userRes = await axiosInstance.get("http://localhost:8000/thientancay/users/profile");
            console.log("AuthContext: /users/profile response:", userRes.data);
            const userData = userRes.data.data;

            if (userData && typeof userData === "object") {
              setCurrentUser(userData);
              console.log("AuthContext: User authenticated.", userData);
            } else {
              // No valid user data, clear any potential state
              setCurrentUser(null);
               console.log("AuthContext: No valid user data found.");
            }
          } catch (err) {
            console.error("AuthContext: Initial profile fetch failed:", err.response?.data || err.message);
            // This is expected if no valid refresh token is present
            setCurrentUser(null); // Ensure user is null on failure
          } finally {
            setLoading(false);
            console.log("AuthContext: Initial check finished. Loading set to false.");
          }
      } else {
          console.log("AuthContext: Skipping initial session check. Loading state or currentUser exists.");
          // If loading is true, another process (like login) is handling auth. Ensure loading becomes false eventually.
           if(loading && currentUser) { // If loading is true but user is authenticated, means loading is for initial check that succeeded
               setLoading(false);
               console.log("AuthContext: Setting loading to false as user is authenticated.");
           }
      }
    };

    checkAuth();
  }, [loading, currentUser]); // Depend on loading and currentUser

  // Function to be called by Login.jsx on successful sign-in
  const login = async (account, password) => {
      setLoading(true);
      setError(null);
      try {
          console.log("AuthContext: Attempting login...");
          const signInRes = await axiosInstance.post(
            "http://localhost:8000/thientancay/users/sign-in",
            { account, password_user: password },
            { withCredentials: true }
          );
          console.log("AuthContext: Sign-in response:", signInRes.data);

          // The interceptor should handle storing the access_token from signInRes.data
          // No need to manually set accessTokenInMemory here if interceptor does it.
          // However, let's explicitly set the state if needed or rely on subsequent profile fetch.

          // After successful sign-in, immediately fetch profile to get user data and confirm auth
          console.log("AuthContext: Sign-in successful, fetching profile...");
          const profileRes = await axiosInstance.get("http://localhost:8000/thientancay/users/profile");
          console.log("AuthContext: Profile fetch after sign-in:", profileRes.data);

          const userData = profileRes.data.data;

           if (userData && typeof userData === "object") {
              setCurrentUser(userData);
              console.log("AuthContext: User authenticated after login.", userData);
              // Navigation will be handled by consuming components based on auth state
              return true; // Indicate success
            } else {
               console.error("AuthContext: Profile fetch did not return valid user data after sign-in.");
               setError("Đăng nhập thất bại: Không nhận được dữ liệu người dùng.");
               setCurrentUser(null);
               return false; // Indicate failure
            }

      } catch (err) {
          console.error("AuthContext: Login failed:", err.response?.data || err.message);
          setError(err.response?.data?.comment || "Đăng nhập thất bại");
          setCurrentUser(null);
          return false; // Indicate failure
      } finally {
          setLoading(false);
           console.log("AuthContext: Login process finished. Loading set to false.");
      }
  };

  // Function to be called by AppServer/UserProfile on logout
  const logout = async () => {
      console.log("AuthContext: Attempting logout...");
      try {
          await axiosInstance.post("http://localhost:8000/thientancay/users/sign-out");
          console.log("AuthContext: Backend logout successful.");
      } catch (err) {
          console.error("AuthContext: Backend logout failed:", err.response?.data || err.message);
          // Continue frontend logout even if backend fails
      } finally {
          console.log("AuthContext: Clearing authentication state.");
          setCurrentUser(null);
           // Navigation will be handled by consuming components
      }
  };

  const isAuthenticated = currentUser !== null;

  useEffect(() => {
    console.log("AuthContext State Changed: currentUser=", currentUser, "isAuthenticated=", isAuthenticated, "loading=", loading);
  }, [currentUser, isAuthenticated, loading]); // Log state changes

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 