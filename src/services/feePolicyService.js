import { api, unwrap } from '../lib/apiClient'

export const feePolicyService = {
  list: async ({ buildingId, vehicleTypeId, isActive, page = 1, pageSize = 20 } = {}) => {
    const res = await api.get('/api/v1/fee-policies', {
      params: {
        buildingId: buildingId || undefined,
        vehicleTypeId: vehicleTypeId || undefined,
        isActive: isActive ?? undefined,
        page,
        pageSize,
      },
    })
    return unwrap(res)
  },
  active: async ({ buildingId, vehicleTypeId } = {}) => {
    const res = await api.get('/api/v1/fee-policies/active', {
      params: {
        buildingId: buildingId || undefined,
        vehicleTypeId: vehicleTypeId || undefined,
      },
    })
    return unwrap(res)
  },
  get: async (id) => {
    const res = await api.get(`/api/v1/fee-policies/${id}`)
    return unwrap(res)
  },
  create: async (payload) => {
    const res = await api.post('/api/v1/fee-policies', payload)
    return unwrap(res)
  },
  update: async (id, payload) => {
    const res = await api.put(`/api/v1/fee-policies/${id}`, payload)
    return unwrap(res)
  },
  remove: async (id) => {
    const res = await api.delete(`/api/v1/fee-policies/${id}`)
    return unwrap(res)
  },
  calculate: async (payload) => {
    const res = await api.post('/api/v1/fee-policies/calculate', payload)
    return unwrap(res)
  },
}
