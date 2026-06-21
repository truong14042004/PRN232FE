import { api, unwrap } from '../lib/apiClient'

export const vehicleService = {
  list: async ({ search, ownerUserId, vehicleTypeId, isActive, page = 1, pageSize = 20 } = {}) => {
    const res = await api.get('/api/v1/vehicles', {
      params: {
        search: search || undefined,
        ownerUserId: ownerUserId || undefined,
        vehicleTypeId: vehicleTypeId || undefined,
        isActive: isActive ?? undefined,
        page,
        pageSize,
      },
    })
    return unwrap(res)
  },
  get: async (id) => {
    const res = await api.get(`/api/v1/vehicles/${id}`)
    return unwrap(res)
  },
  byPlate: async (plateNumber) => {
    const res = await api.get(`/api/v1/vehicles/by-plate/${plateNumber}`)
    return unwrap(res)
  },
  create: async (payload) => {
    const res = await api.post('/api/v1/vehicles', payload)
    return unwrap(res)
  },
  update: async (id, payload) => {
    const res = await api.put(`/api/v1/vehicles/${id}`, payload)
    return unwrap(res)
  },
  remove: async (id) => {
    const res = await api.delete(`/api/v1/vehicles/${id}`)
    return res.data
  },
}
