import { api, unwrap } from '../lib/apiClient'

export const paymentService = {
  list: async ({ sessionId, plateNumber, status, page = 1, pageSize = 20 } = {}) => {
    const res = await api.get('/api/v1/payments', {
      params: {
        sessionId: sessionId || undefined,
        plateNumber: plateNumber || undefined,
        status: status ?? undefined,
        page,
        pageSize,
      },
    })
    return unwrap(res)
  },
  get: async (id) => {
    const res = await api.get(`/api/v1/payments/${id}`)
    return unwrap(res)
  },
  bySession: async (sessionId) => {
    const res = await api.get(`/api/v1/payments/by-session/${sessionId}`)
    return unwrap(res)
  },
  bySubscription: async (subscriptionId) => {
    const res = await api.get(`/api/v1/payments/by-subscription/${subscriptionId}`)
    return unwrap(res)
  },
  create: async (payload) => {
    const res = await api.post('/api/v1/payments', payload)
    return unwrap(res)
  },
  confirm: async (id) => {
    const res = await api.post(`/api/v1/payments/${id}/confirm`)
    return unwrap(res)
  },
  cancel: async (id) => {
    const res = await api.post(`/api/v1/payments/${id}/cancel`)
    return unwrap(res)
  },
  payosLink: async (id) => {
    const res = await api.post(`/api/v1/payments/${id}/payos-link`)
    return unwrap(res)
  },
}
