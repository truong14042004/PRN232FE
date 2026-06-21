import { api, unwrap } from '../lib/apiClient'

export const parkingSlotService = {
  list: async ({ buildingId, floorId, zoneId, page = 1, pageSize = 100 } = {}) => {
    const res = await api.get('/api/v1/parking-slots', {
      params: {
        buildingId: buildingId || undefined,
        floorId: floorId || undefined,
        zoneId: zoneId || undefined,
        page,
        pageSize,
      },
    })
    return unwrap(res)
  },
  get: async (id) => {
    const res = await api.get(`/api/v1/parking-slots/${id}`)
    return unwrap(res)
  },
  create: async (payload) => {
    const res = await api.post('/api/v1/parking-slots', payload)
    return unwrap(res)
  },
  update: async (id, payload) => {
    const res = await api.put(`/api/v1/parking-slots/${id}`, payload)
    return unwrap(res)
  },
  remove: async (id) => {
    const res = await api.delete(`/api/v1/parking-slots/${id}`)
    return res.data
  },
  updatePosition: async (id, payload) => {
    const res = await api.put(`/api/v1/parking-slots/${id}/position`, payload)
    return unwrap(res)
  },
  updateStatus: async (id, status) => {
    const res = await api.put(`/api/v1/parking-slots/${id}/status`, { status })
    return unwrap(res)
  },
  generateGrid: async (payload) => {
    const res = await api.post('/api/v1/parking-slots/generate-grid', payload)
    return unwrap(res)
  },
}
