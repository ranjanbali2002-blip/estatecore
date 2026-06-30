import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import api, { setAccessToken, registerAuthHandlers } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [workspace, setWorkspace] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  // global gate signal for trial/inactive/plan
  const [gate, setGate] = useState(null); // { code, error }

  const tokenRef = useRef(null);

  const applyToken = useCallback((t) => {
    tokenRef.current = t;
    setToken(t);
    setAccessToken(t);
  }, []);

  const setSession = useCallback(
    (data) => {
      applyToken(data.accessToken);
      setUser(data.user);
      setWorkspace(data.workspace || null);
    },
    [applyToken]
  );

  const clearSession = useCallback(() => {
    applyToken(null);
    setUser(null);
    setWorkspace(null);
  }, [applyToken]);

  const login = useCallback(
    async (email, password) => {
      const { data } = await api.post('/auth/login', { email, password });
      setSession(data.data);
      return data.data;
    },
    [setSession]
  );

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      /* ignore */
    }
    clearSession();
    setGate(null);
  }, [clearSession]);

  // Used by axios interceptor — returns new access token or null
  const refreshAccessToken = useCallback(async () => {
    try {
      const { data } = await api.post('/auth/refresh');
      setSession(data.data);
      return data.data.accessToken;
    } catch (e) {
      clearSession();
      return null;
    }
  }, [setSession, clearSession]);

  // register handlers for the axios interceptor
  useEffect(() => {
    registerAuthHandlers({
      refresh: refreshAccessToken,
      authFail: () => {
        clearSession();
      },
      forbidden: (code, error) => {
        if (code === 'TRIAL_EXPIRED' || code === 'WORKSPACE_INACTIVE') {
          setGate({ code, error });
        }
        // PLAN_REQUIRED handled at call sites via thrown error
      },
    });
  }, [refreshAccessToken, clearSession]);

  // silent refresh on mount
  useEffect(() => {
    (async () => {
      await refreshAccessToken();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keep workspace fresh (e.g. after brand update) without a full reload
  const refreshMe = useCallback(async () => {
    const { data } = await api.get('/auth/me');
    setUser(data.data.user);
    setWorkspace(data.data.workspace || null);
    return data.data;
  }, []);

  const value = {
    user,
    workspace,
    token,
    loading,
    gate,
    setGate,
    setWorkspace,
    login,
    logout,
    refreshAccessToken,
    refreshMe,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
