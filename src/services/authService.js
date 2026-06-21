import { api, unwrap } from '../lib/apiClient'

export const authService = {
  login: async (payload) => {
    const res = await api.post('/api/v1/auth/login', payload)
    return unwrap(res)
  },
  register: async (payload) => {
    const res = await api.post('/api/v1/auth/register', payload)
    return unwrap(res)
  },
  me: async () => {
    const res = await api.get('/api/v1/auth/me')
    return unwrap(res)
  },
  changePassword: async (payload) => {
    const res = await api.post('/api/v1/auth/change-password', payload)
    return res.data
  },
  logout: async (refreshToken) => {
    const res = await api.post('/api/v1/auth/logout', { refreshToken })
    return res.data
  },
}
