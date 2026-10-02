import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api/v1';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000
});

// Request Interceptor: Attach JWT Token and generate Request ID
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('erp_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const tenantRaw = localStorage.getItem('erp_active_tenant');
    if (tenantRaw) {
      try {
        const tenant = JSON.parse(tenantRaw);
        if (tenant && tenant.id) {
          config.headers['X-Tenant-ID'] = tenant.id;
        }
      } catch (e) {
        // ignore JSON parse error
      }
    }

    // Attach request tracing ID
    config.headers['X-Request-Id'] = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Token refresh and error normalization
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized (Token Expiry)
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If the request was the login or refresh endpoint itself, don't loop
      if (originalRequest.url.includes('/auth/login') || originalRequest.url.includes('/auth/refresh-token')) {
        return Promise.reject(formatApiError(error));
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('erp_refresh_token');
      if (!refreshToken) {
        localStorage.removeItem('erp_access_token');
        localStorage.removeItem('erp_user');
        window.location.href = '/login';
        return Promise.reject(new Error('Session expired. Please log in again.'));
      }

      try {
        const { data } = await axios.post(`${baseURL}/auth/refresh-token`, { refreshToken });
        const newAccessToken = data.data.tokens.accessToken;

        localStorage.setItem('erp_access_token', newAccessToken);
        if (data.data.tokens.refreshToken) {
          localStorage.setItem('erp_refresh_token', data.data.tokens.refreshToken);
        }

        apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem('erp_access_token');
        localStorage.removeItem('erp_refresh_token');
        localStorage.removeItem('erp_user');
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(formatApiError(error));
  }
);

/**
 * Standardize API error messages
 */
function formatApiError(error) {
  if (error.response) {
    const data = error.response.data;
    const message = data?.message || data?.error || `Request failed with status ${error.response.status}`;
    const err = new Error(message);
    err.status = error.response.status;
    err.errors = data?.errors || [];
    return err;
  }
  if (error.request) {
    return new Error('Unable to connect to the ERP server. Please verify your connection.');
  }
  return error;
}

export default apiClient;
