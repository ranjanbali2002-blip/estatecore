import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`,
  withCredentials: true,
});

// --- module-level auth bridge (set by AuthContext) ---
let accessToken = null;
let onRefresh = null; // async () => newAccessToken | null
let onAuthFail = null; // () => void  (logout + redirect)
let onForbidden = null; // (code) => void  (trial_expired / workspace_inactive / plan_required)

export function setAccessToken(token) {
  accessToken = token;
}
export function registerAuthHandlers({ refresh, authFail, forbidden }) {
  onRefresh = refresh;
  onAuthFail = authFail;
  onForbidden = forbidden;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshing = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { response, config } = error;
    if (!response) return Promise.reject(error);

    const code = response.data?.error?.code;

    // 401 → try a single refresh + retry
    if (response.status === 401 && !config._retried && onRefresh) {
      config._retried = true;
      try {
        if (!refreshing) refreshing = onRefresh();
        const newToken = await refreshing;
        refreshing = null;
        if (newToken) {
          config.headers.Authorization = `Bearer ${newToken}`;
          return api(config);
        }
      } catch (e) {
        refreshing = null;
      }
      if (onAuthFail) onAuthFail();
      return Promise.reject(error);
    }

    // 403 with special codes
    if (response.status === 403 && onForbidden) {
      if (['TRIAL_EXPIRED', 'WORKSPACE_INACTIVE', 'PLAN_REQUIRED'].includes(code)) {
        onForbidden(code, response.data?.error);
      }
    }

    return Promise.reject(error);
  }
);

/** Extracts a human message from an axios error. */
export function errMsg(error, fallback = 'Something went wrong') {
  return error?.response?.data?.error?.message || error?.message || fallback;
}

/** Field-level errors from a 422 validation response. */
export function fieldErrors(error) {
  const fields = error?.response?.data?.error?.fields;
  if (!Array.isArray(fields)) return {};
  return fields.reduce((acc, f) => {
    acc[f.field] = f.message;
    return acc;
  }, {});
}

export default api;
