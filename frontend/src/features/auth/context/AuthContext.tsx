import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { User, LoginResponse } from '../../../types';
import { setClientTokens, setLogoutCallback, setRefreshCallback } from '../../../api/axiosClient';
import { logger } from '../../../lib/utils/logger';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginResponse) => void;
  logout: () => void;
  updateUser: (updatedUser: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = sessionStorage.getItem('vms_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    return sessionStorage.getItem('vms_access_token');
  });
  const [refreshToken, setRefreshToken] = useState<string | null>(() => {
    return sessionStorage.getItem('vms_refresh_token');
  });
  const [isLoading] = useState<boolean>(false);

  const logout = useCallback(() => {
    logger.info('Logging out user...');
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    setClientTokens(null, null);
    sessionStorage.removeItem('vms_user');
    sessionStorage.removeItem('vms_access_token');
    sessionStorage.removeItem('vms_refresh_token');
  }, []);

  const login = useCallback((data: LoginResponse) => {
    logger.info('Logging in user...', data.user.email);
    setUser(data.user);
    setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    setClientTokens(data.accessToken, data.refreshToken);
    sessionStorage.setItem('vms_user', JSON.stringify(data.user));
    sessionStorage.setItem('vms_access_token', data.accessToken);
    sessionStorage.setItem('vms_refresh_token', data.refreshToken);
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    logger.info('Updating user profile state...', updatedUser.email);
    setUser(updatedUser);
    sessionStorage.setItem('vms_user', JSON.stringify(updatedUser));
  }, []);

  // Update Axios tokens whenever state tokens change
  useEffect(() => {
    setClientTokens(accessToken, refreshToken);
  }, [accessToken, refreshToken]);

  // Hook up logout and token refresh callbacks for the Axios client
  useEffect(() => {
    setLogoutCallback(logout);
    setRefreshCallback((access, refresh) => {
      setAccessToken(access);
      setRefreshToken(refresh);
      sessionStorage.setItem('vms_access_token', access);
      sessionStorage.setItem('vms_refresh_token', refresh);
    });
  }, [logout]);

  // Automatic token refresh loop (e.g. refresh every 14 minutes before 15m expiration)
  useEffect(() => {
    if (!accessToken || !refreshToken) return;

    // Refresh token after 14 minutes
    const refreshTime = 14 * 60 * 1000;
    const timer = setTimeout(async () => {
      logger.info('Auto-refreshing access token...');
      try {
        // We can call `/auth/refresh-token` directly via Axios client to rotate tokens:
        const axios = await import('axios');
        const res = await axios.default.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5050'}/auth/refresh-token`,
          { refreshToken }
        );
        const newData = res.data.data;
        setAccessToken(newData.accessToken);
        setRefreshToken(newData.refreshToken);
        sessionStorage.setItem('vms_access_token', newData.accessToken);
        sessionStorage.setItem('vms_refresh_token', newData.refreshToken);
        logger.info('Auto-refresh token successful');
      } catch (err) {
        logger.error('Auto-refresh token failed', err);
        logout();
      }
    }, refreshTime);

    return () => clearTimeout(timer);
  }, [accessToken, refreshToken, user?.email, logout]);

  const value = useMemo(() => {
    return {
      user,
      accessToken,
      refreshToken,
      isAuthenticated: !!accessToken,
      isLoading,
      login,
      logout,
      updateUser,
    };
  }, [user, accessToken, refreshToken, isLoading, login, logout, updateUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
export default AuthContext;
