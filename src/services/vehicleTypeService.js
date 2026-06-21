import { api, unwrap } from '../lib/apiClient'

export const vehicleTypeService = {
  list: async ({ search, isActive, page = 1, pageSize = 20 } = {}) => {
    const res = await api.get('/api/v1/vehicle-types', {
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
    const res = await api.get(`/api/v1/vehicle-types/${id}`)
    return unwrap(res)
  },
  create: async (payload) => {
    const res = await api.post('/api/v1/vehicle-types', payload)
    return unwrap(res)
  },
  update: async (id, payload) => {
    const res = await api.put(`/api/v1/vehicle-types/${id}`, payload)
    return unwrap(res)
  },
  remove: async (id) => {
    const res = await api.delete(`/api/v1/vehicle-types/${id}`)
    return res.data
  },
}
