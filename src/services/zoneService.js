import { api, unwrap } from '../lib/apiClient'

export const zoneService = {
  list: async ({ buildingId, floorId, isActive, page = 1, pageSize = 20 } = {}) => {
    const res = await api.get('/api/v1/zones', {
      params: {
        buildingId: buildingId || undefined,
        floorId: floorId || undefined,
        isActive: isActive ?? undefined,
        page,
        pageSize,
      },
    })
    return unwrap(res)
  },
  get: async (id) => {
    const res = await api.get(`/api/v1/zones/${id}`)
    return unwrap(res)
  },
  create: async (payload) => {
    const res = await api.post('/api/v1/zones', payload)
    return unwrap(res)
  },
  update: async (id, payload) => {
    const res = await api.put(`/api/v1/zones/${id}`, payload)
    return unwrap(res)
  },
  remove: async (id) => {
    const res = await api.delete(`/api/v1/zones/${id}`)
    return res.data
  },
}
