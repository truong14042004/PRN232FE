import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

// Token storage keys
const ACCESS_TOKEN_KEY = 'pm_access_token'
const REFRESH_TOKEN_KEY = 'pm_refresh_token'

export const tokenStore = {
  getAccess: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  set: ({ accessToken, refreshToken }) => {
    if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
    if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  },
  clear: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },
}

// Main API instance (goes through Ocelot gateway)
export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Separate bare instance for refresh calls to avoid interceptor recursion
const refreshApi = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach bearer token on every request
api.interceptors.request.use((config) => {
  const token = tokenStore.getAccess()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// --- Refresh token handling with request queue ---
let isRefreshing = false
let pendingQueue = []

const processQueue = (error, token = null) => {
  pendingQueue.forEach((p) => {
    if (error) p.reject(error)
    else p.resolve(token)
  })
  pendingQueue = []
}

// Callback the AuthContext registers to react to a forced logout
let onForcedLogout = null
export const setForcedLogoutHandler = (fn) => {
  onForcedLogout = fn
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const status = error.response?.status

    // Only try to refresh once per request, and never for the auth endpoints themselves
    const isAuthCall = originalRequest?.url?.includes('/api/v1/auth/')

    if (status === 401 && !originalRequest._retry && !isAuthCall) {
      const refreshToken = tokenStore.getRefresh()
      if (!refreshToken) {
        onForcedLogout?.()
        return Promise.reject(error)
      }

      if (isRefreshing) {
        // Queue the request until the in-flight refresh resolves
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const { data } = await refreshApi.post('/api/v1/auth/refresh-token', {
          refreshToken,
        })
        const auth = data?.data
        if (!auth?.accessToken) throw new Error('Invalid refresh response')

        tokenStore.set({
          accessToken: auth.accessToken,
          refreshToken: auth.refreshToken,
        })
        processQueue(null, auth.accessToken)
        originalRequest.headers.Authorization = `Bearer ${auth.accessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        tokenStore.clear()
        onForcedLogout?.()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

// Unwrap ApiResponse<T> envelope → returns the `data` field
export const unwrap = (response) => response?.data?.data

// Extract a human-friendly error message from an ApiResponse error
export const getErrorMessage = (error, fallback = 'Đã có lỗi xảy ra') => {
  const payload = error?.response?.data
  if (payload?.errors?.length) return payload.errors.join(', ')
  if (payload?.message) return payload.message
  if (error?.message) return error.message
  return fallback
}
