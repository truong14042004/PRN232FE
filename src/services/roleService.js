import { api, unwrap } from '../lib/apiClient'

export const roleService = {
  list: async ({ page = 1, pageSize = 20, search } = {}) => {
    const res = await api.get('/api/v1/roles', {
      params: { page, pageSize, search: search || undefined },
    })
    return unwrap(res)
  },
  get: async (id) => {
    const res = await api.get(`/api/v1/roles/${id}`)
    return unwrap(res)
  },
  create: async (payload) => {
    const res = await api.post('/api/v1/roles', payload)
    return unwrap(res)
  },
  update: async (id, payload) => {
    const res = await api.put(`/api/v1/roles/${id}`, payload)
    return unwrap(res)
  },
  remove: async (id) => {
    const res = await api.delete(`/api/v1/roles/${id}`)
    return res.data
  },
}
