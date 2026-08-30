import { useState, useEffect, useCallback, useMemo } from "react";
import { AuthContext } from "./auth-context";
import {
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser,
} from "../services/authService";

const STORAGE_TOKEN_KEY = "venseven_auth_token";
const STORAGE_USER_KEY = "venseven_auth_user";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_TOKEN_KEY) || null;
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem(STORAGE_USER_KEY);
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Logout handler
  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch {
      // Ignore network errors on logout
    } finally {
      setToken(null);
      setUser(null);
      setAuthError(null);
      try {
        localStorage.removeItem(STORAGE_TOKEN_KEY);
        localStorage.removeItem(STORAGE_USER_KEY);
      } catch (err) {
        console.error("Failed to clear auth storage:", err);
      }
    }
  }, []);

  // Initialize and verify existing session
  useEffect(() => {
    let isMounted = true;

    async function verifySession() {
      const savedToken = localStorage.getItem(STORAGE_TOKEN_KEY);

      if (!savedToken) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      try {
        const response = await getCurrentUser(savedToken);
        if (isMounted && response?.success && response?.user) {
          setUser(response.user);
          localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(response.user));
        } else {
          // Token invalid
          if (isMounted) {
            logout();
          }
        }
      } catch (error) {
        console.warn("[Auth]: Session verification failed:", error.message);
        // Only log out if 401 Unauthorized (expired/invalid token), not if server is unreachable
        if (error.status === 401 && isMounted) {
          logout();
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    verifySession();

    return () => {
      isMounted = false;
    };
  }, [logout]);

  // Sign In action
  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const response = await loginUser(email, password);

      if (response?.success && response?.token && response?.user) {
        setToken(response.token);
        setUser(response.user);

        localStorage.setItem(STORAGE_TOKEN_KEY, response.token);
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(response.user));

        return { success: true, user: response.user };
      } else {
        throw new Error(response?.message || "Sign in failed");
      }
    } catch (error) {
      const message = error.data?.message || error.message || "Invalid credentials";
      setAuthError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Register action
  const register = useCallback(async (name, email, password, phone = "") => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const response = await registerUser(name, email, password, phone);

      if (response?.success && response?.token && response?.user) {
        setToken(response.token);
        setUser(response.user);

        localStorage.setItem(STORAGE_TOKEN_KEY, response.token);
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(response.user));

        return { success: true, user: response.user };
      } else {
        throw new Error(response?.message || "Registration failed");
      }
    } catch (error) {
      const message = error.data?.message || error.message || "Registration failed";
      setAuthError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setAuthError(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      isLoading,
      authError,
      login,
      register,
      logout,
      clearError,
    }),
    [user, token, isLoading, authError, login, register, logout, clearError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
