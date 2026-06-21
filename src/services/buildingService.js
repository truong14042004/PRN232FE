import { api, unwrap } from '../lib/apiClient'

export const buildingService = {
  list: async ({ search, isActive, page = 1, pageSize = 20 } = {}) => {
    const res = await api.get('/api/v1/buildings', {
      params: {
        search: search || undefined,
        isActive: isActive ?? undefined,
        page,
        pageSize,
      },
    })
    return unwrap(res)
  },
  get: async (id) => {
    const res = await api.get(`/api/v1/buildings/${id}`)
    return unwrap(res)
  },
  create: async (payload) => {
    const res = await api.post('/api/v1/buildings', payload)
    return unwrap(res)
  },
  update: async (id, payload) => {
    const res = await api.put(`/api/v1/buildings/${id}`, payload)
    return unwrap(res)
  },
  remove: async (id) => {
    const res = await api.delete(`/api/v1/buildings/${id}`)
    return res.data
  },
}
