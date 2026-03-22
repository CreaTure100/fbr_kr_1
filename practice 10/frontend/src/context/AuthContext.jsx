import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const isAuthenticated = !!localStorage.getItem('accessToken');

  const fetchMe = async () => {
    try {
      const res = await authApi.me();
      setUser(res.data);
    } catch (e) {
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchMe();
    } else {
      setLoadingUser(false);
      setUser(null);
    }
  }, []);

  const register = async ({ email, first_name, last_name, password }) => {
    await authApi.register({ email, first_name, last_name, password });
  };

  const login = async ({ email, password }) => {
    const res = await authApi.login({ email, password });
    localStorage.setItem('accessToken', res.data.accessToken);
    localStorage.setItem('refreshToken', res.data.refreshToken);
    await fetchMe();
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!localStorage.getItem('accessToken'),
      loadingUser,
      register,
      login,
      logout,
      fetchMe
    }),
    [user, loadingUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}