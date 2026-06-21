import { api, unwrap } from '../lib/apiClient'

export const gateService = {
  list: async ({ buildingId, isActive, page = 1, pageSize = 20 } = {}) => {
    const res = await api.get('/api/v1/gates', {
      params: {
        buildingId: buildingId || undefined,
        isActive: isActive ?? undefined,
        page,
        pageSize,
      },
    })
    return unwrap(res)
  },
  get: async (id) => {
    const res = await api.get(`/api/v1/gates/${id}`)
    return unwrap(res)
  },
  create: async (payload) => {
    const res = await api.post('/api/v1/gates', payload)
    return unwrap(res)
  },
  update: async (id, payload) => {
    const res = await api.put(`/api/v1/gates/${id}`, payload)
    return unwrap(res)
  },
  remove: async (id) => {
    const res = await api.delete(`/api/v1/gates/${id}`)
    return res.data
  },
}
