import React, { createContext, useContext, useState, useEffect } from "react";
import axiosPublic, { axiosPrivate } from "@/api/axios";

export interface Experience {
  title: string;
  company: string;
  years: string;
}

export interface Education {
  degree: string;
  school: string;
  years: string;
}

export interface User {
  _id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  bio?: string;
  location?: string;
  skills?: string[];
  avatar?: string;
  followers?: string[];
  following?: string[];
  posts?: { _id: string; body: string; createdAt: string }[];
  experience?: Experience[];
  education?: Education[];
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => Promise<void>;
  clearAuth: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Persist auth into localStorage and configure axiosPrivate
   */
  const setAuth = (userData: User, token: string) => {
    try {
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("accessToken", token);
    } catch (e) {
      // ignore storage errors
    }

    setUser(userData);
    setAccessToken(token);
    axiosPrivate.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  };

  /**
   * Clear auth from state and storage
   */
  const clearAuth = () => {
    setUser(null);
    setAccessToken(null);

    try {
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
    } catch (e) {
      // ignore storage errors
    }

    delete axiosPrivate.defaults.headers.common["Authorization"];
  };

  /**
   * Refresh user information from server using accessToken (must be set)
   */
  const refreshUser = async () => {
    try {
      const resp = await axiosPrivate.get("/api/users/me", {
        withCredentials: true,
      });
      if (resp?.data) {
        setUser(resp.data);
        try {
          localStorage.setItem("user", JSON.stringify(resp.data));
        } catch (e) {
          // ignore
        }
      }
    } catch (err) {
      console.error("AuthContext: refreshUser failed", err);
      clearAuth();
    }
  };

  /**
   * Logout: attempt server logout (clears refresh cookie) and clear local state
   */
  const logout = async () => {
    try {
      // Use public axios for logout in case access token is invalid
      await axiosPublic.post("/auth/logout", {}, { withCredentials: true });
    } catch (err) {
      console.error("Logout error (ignored):", err);
    } finally {
      clearAuth();
    }
  };

  /**
   * Validate token by fetching current user with axiosPrivate.
   * Returns user data on success, or null on failure.
   */
  const validateTokenAndGetUser = async (token: string) => {
    try {
      // Temporarily set header for validation
      const prev = axiosPrivate.defaults.headers.common["Authorization"];
      axiosPrivate.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      const resp = await axiosPrivate.get("/api/users/me", {
        withCredentials: true,
      });

      // restore previous header (we'll set the correct one later)
      if (prev) {
        axiosPrivate.defaults.headers.common["Authorization"] = prev;
      } else {
        delete axiosPrivate.defaults.headers.common["Authorization"];
      }

      if (resp?.data) return resp.data;
      return null;
    } catch (err) {
      // token invalid or request failed
      return null;
    }
  };

  /**
   * Initialization flow (runs on mount)
   * 1. Check localStorage for token+user
   * 2. If token exists, validate it by calling /api/users/me
   * 3. If validation fails, attempt cookie-based refresh (/auth/refresh)
   * 4. If refresh succeeds, set new token + user, otherwise clearAuth
   */
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        const storedToken = localStorage.getItem("accessToken");
        const storedUser = localStorage.getItem("user");

        if (storedToken && storedUser) {
          // Try quick validation with stored token
          const validUser = await validateTokenAndGetUser(storedToken);
          if (validUser) {
            if (!mounted) return;
            setAuth(validUser, storedToken);
            setLoading(false);
            return;
          }
          // token invalid -> attempt cookie-based refresh
        }

        // Try cookie-based refresh (returns fresh accessToken and user)
        try {
          const refreshResp = await axiosPublic.get("/auth/refresh", {
            withCredentials: true,
          });
          const newToken = refreshResp.data?.accessToken;
          const newUser = refreshResp.data?.user || refreshResp.data;

          if (newToken && newUser) {
            if (!mounted) return;
            setAuth(newUser, newToken);
            setLoading(false);
            return;
          }
        } catch (refreshErr) {
          // refresh failed (no valid session)
        }

        // nothing worked — ensure cleared
        if (!mounted) return;
        clearAuth();
      } catch (err) {
        console.error("Auth initialization error:", err);
        clearAuth();
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
    // run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: AuthContextType = {
    user,
    accessToken,
    loading,
    setAuth,
    logout,
    clearAuth,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading ? (
        children
      ) : (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading DevConnect...</p>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
