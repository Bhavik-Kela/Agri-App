import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import API, { setApiAuthToken } from "../../services/api";
import { saveSession, loadSession, clearSession } from "../services/authStorage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  // On app launch, restore whatever session was persisted from last time.
  useEffect(() => {
    (async () => {
      try {
        const { token: storedToken, user: storedUser } = await loadSession();
        if (storedToken && storedUser) {
          setApiAuthToken(storedToken);
          setToken(storedToken);
          setUser(storedUser);
        }
      } finally {
        setBootstrapping(false);
      }
    })();
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await API.post("/auth/login", { email, password });
    const { token: newToken, user: newUser } = res.data || {};
    if (newToken && newUser) {
      await saveSession(newToken, newUser);
      setApiAuthToken(newToken);
      setToken(newToken);
      setUser(newUser);
    }
    return res.data;
  }, []);

  const register = useCallback(async ({ name, email, password, role }) => {
    const res = await API.post("/auth/register", {
      name,
      email,
      password,
      role,
    });
    return res.data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await clearSession();
    } catch (err) {
      console.log("Error clearing session:", err);
    }
    setApiAuthToken(null);
    setToken(null);
    setUser(null);
  }, []);

  // Pulls the latest profile from the backend and refreshes local state,
  // used after boot to make sure the cached user is still accurate.
  const refreshProfile = useCallback(async () => {
    const res = await API.get("/auth/profile");
    setUser(res.data);
    const { token: currentToken } = await loadSession();
    if (currentToken) {
      setApiAuthToken(currentToken);
      await saveSession(currentToken, res.data);
    }
    return res.data;
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      bootstrapping,
      isAuthenticated: !!token,
      login,
      register,
      logout,
      refreshProfile,
    }),
    [user, token, bootstrapping, login, register, logout, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
