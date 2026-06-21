import { api, unwrap } from '../lib/apiClient'

export const subscriptionService = {
  list: async ({ status, buildingId, page = 1, pageSize = 20 } = {}) => {
    const res = await api.get('/api/v1/subscriptions', {
      params: {
        status: status ?? undefined,
        buildingId: buildingId || undefined,
        page,
        pageSize,
      },
    })
    return unwrap(res)
  },
  get: async (id) => {
    const res = await api.get(`/api/v1/subscriptions/${id}`)
    return unwrap(res)
  },
  activeByPlate: async (plateNumber) => {
    const res = await api.get(`/api/v1/subscriptions/active/by-plate/${plateNumber}`)
    return unwrap(res)
  },
  create: async (payload) => {
    const res = await api.post('/api/v1/subscriptions', payload)
    return unwrap(res)
  },
  update: async (id, payload) => {
    const res = await api.put(`/api/v1/subscriptions/${id}`, payload)
    return unwrap(res)
  },
  renew: async (id, months = 1) => {
    const res = await api.post(`/api/v1/subscriptions/${id}/renew`, { months })
    return unwrap(res)
  },
  suspend: async (id) => {
    const res = await api.post(`/api/v1/subscriptions/${id}/suspend`)
    return unwrap(res)
  },
  cancel: async (id) => {
    const res = await api.post(`/api/v1/subscriptions/${id}/cancel`)
    return unwrap(res)
  },
}
