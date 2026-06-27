import axios from 'axios';
import { logger } from '../lib/utils/logger';

let currentAccessToken: string | null = sessionStorage.getItem('vms_access_token');
let currentRefreshToken: string | null = sessionStorage.getItem('vms_refresh_token');
let logoutCallback: (() => void) | null = null;
let refreshCallback: ((access: string, refresh: string) => void) | null = null;

export const setClientTokens = (access: string | null, refresh: string | null) => {
  currentAccessToken = access;
  currentRefreshToken = refresh;
};

export const setLogoutCallback = (callback: () => void) => {
  logoutCallback = callback;
};

export const setRefreshCallback = (callback: (access: string, refresh: string) => void) => {
  refreshCallback = callback;
};

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5050',
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use(
  (config) => {
    if (currentAccessToken) {
      config.headers.Authorization = `Bearer ${currentAccessToken}`;
    }
    return config;
  },
  (error) => {
    logger.error('API request error', error);
    return Promise.reject(error);
  }
);

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Check if it's a 401 error and it hasn't been retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;

      if (!currentRefreshToken) {
        logger.warn('401 error encountered but no refresh token available');
        if (logoutCallback) logoutCallback();
        return Promise.reject(error);
      }

      isRefreshing = true;
      logger.info('Attempting token refresh...');

      try {
        // Call refresh endpoint directly using a separate axios request to avoid interceptor loop
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5050'}/auth/refresh-token`,
          { refreshToken: currentRefreshToken }
        );

        const { accessToken: newAccess, refreshToken: newRefresh } = response.data.data;
        
        logger.info('Token refresh successful');
        setClientTokens(newAccess, newRefresh);
        
        if (refreshCallback) {
          refreshCallback(newAccess, newRefresh);
        }

        processQueue(null, newAccess);
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        isRefreshing = false;
        
        return axiosClient(originalRequest);
      } catch (refreshError: any) {
        logger.error('Token refresh failed', refreshError);
        processQueue(refreshError, null);
        isRefreshing = false;
        if (logoutCallback) logoutCallback();
        return Promise.reject(refreshError);
      }
    }

    logger.error('API response error', {
      url: originalRequest?.url,
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
    });

    return Promise.reject(error);
  }
);

export default axiosClient;
