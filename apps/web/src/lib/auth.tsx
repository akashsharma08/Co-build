'use client';

import Cookies from 'js-cookie';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  apiFetch,
  bindAuthTokenHandlers,
  mediaUrl,
  type AuthResponse,
  type Profile,
  type PublicUser,
} from './api';

const ACCESS_TOKEN_KEY = 'cobuild_access_token';
const REFRESH_TOKEN_KEY = 'cobuild_refresh_token';

type AuthContextValue = {
  user: PublicUser | null;
  token: string | null;
  avatarUrl: string | null;
  loading: boolean;
  loggingOut: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: {
    email: string;
    password: string;
    displayName: string;
    username: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  acceptSession: (auth: AuthResponse) => Promise<void>;
  refresh: () => Promise<void>;
  setAvatarUrl: (url: string | null) => void;
  setUser: (user: PublicUser | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredTokens() {
  return {
    accessToken: Cookies.get(ACCESS_TOKEN_KEY) ?? null,
    refreshToken: Cookies.get(REFRESH_TOKEN_KEY) ?? null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const loadAvatar = useCallback(async (accessToken: string) => {
    try {
      const profile = await apiFetch<Profile>('/profiles/me', {
        token: accessToken,
      });
      setAvatarUrl(mediaUrl(profile.avatarUrl));
    } catch {
      setAvatarUrl(null);
    }
  }, []);

  const persist = useCallback(
    async (auth: AuthResponse) => {
      Cookies.set(ACCESS_TOKEN_KEY, auth.accessToken, {
        expires: 1,
        sameSite: 'lax',
      });
      Cookies.set(REFRESH_TOKEN_KEY, auth.refreshToken, {
        expires: 30,
        sameSite: 'lax',
      });
      setToken(auth.accessToken);
      setUser(auth.user);
      await loadAvatar(auth.accessToken);
    },
    [loadAvatar],
  );

  const clearSession = useCallback(() => {
    Cookies.remove(ACCESS_TOKEN_KEY);
    Cookies.remove(REFRESH_TOKEN_KEY);
    setToken(null);
    setUser(null);
    setAvatarUrl(null);
  }, []);

  useEffect(() => {
    bindAuthTokenHandlers({
      getTokens: readStoredTokens,
      setTokens: ({ accessToken, refreshToken }) => {
        Cookies.set(ACCESS_TOKEN_KEY, accessToken, {
          expires: 1,
          sameSite: 'lax',
        });
        Cookies.set(REFRESH_TOKEN_KEY, refreshToken, {
          expires: 30,
          sameSite: 'lax',
        });
        setToken(accessToken);
      },
      clearTokens: clearSession,
    });
  }, [clearSession]);

  const refresh = useCallback(async () => {
    // Yield so any setState runs after an async boundary (not sync in effects).
    await Promise.resolve();

    const { accessToken, refreshToken } = readStoredTokens();
    if (!accessToken && !refreshToken) {
      setLoading(false);
      return;
    }

    try {
      if (accessToken) {
        const me = await apiFetch<PublicUser>('/auth/me', {
          token: accessToken,
        });
        setToken(accessToken);
        setUser(me);
        await loadAvatar(accessToken);
      } else if (refreshToken) {
        const auth = await apiFetch<AuthResponse>('/auth/refresh', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
          skipAuthRefresh: true,
        });
        await persist(auth);
      }
    } catch {
      clearSession();
    } finally {
      setLoading(false);
    }
  }, [clearSession, loadAvatar, persist]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      await refresh();
      if (cancelled) return;
    })();

    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await apiFetch<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        skipAuthRefresh: true,
      });
      await persist(result);
    },
    [persist],
  );

  const register = useCallback(
    async (input: {
      email: string;
      password: string;
      displayName: string;
      username: string;
    }) => {
      const result = await apiFetch<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(input),
        skipAuthRefresh: true,
      });
      await persist(result);
    },
    [persist],
  );

  const logout = useCallback(async () => {
    setLoggingOut(true);
    const { refreshToken } = readStoredTokens();
    try {
      if (refreshToken) {
        await apiFetch('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
          skipAuthRefresh: true,
        });
      }
    } catch {
      // Always clear local session even if revoke fails.
    } finally {
      clearSession();
      setLoggingOut(false);
    }
  }, [clearSession]);

  const logoutAll = useCallback(async () => {
    setLoggingOut(true);
    try {
      await apiFetch('/auth/logout-all', { method: 'POST' });
    } catch {
      // Fall through to local clear.
    } finally {
      clearSession();
      setLoggingOut(false);
    }
  }, [clearSession]);

  const acceptSession = useCallback(
    async (auth: AuthResponse) => {
      await persist(auth);
    },
    [persist],
  );

  const value = useMemo(
    () => ({
      user,
      token,
      avatarUrl,
      loading,
      loggingOut,
      login,
      register,
      logout,
      logoutAll,
      acceptSession,
      refresh,
      setAvatarUrl,
      setUser,
    }),
    [
      user,
      token,
      avatarUrl,
      loading,
      loggingOut,
      login,
      register,
      logout,
      logoutAll,
      acceptSession,
      refresh,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
