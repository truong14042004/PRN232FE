import { api, unwrap } from '../lib/apiClient'

export const reservationService = {
  list: async ({
    buildingId,
    status,
    plateNumber,
    driverUserId,
    reservedFromStart,
    reservedFromEnd,
    page = 1,
    pageSize = 20,
  } = {}) => {
    const res = await api.get('/api/v1/reservations', {
      params: {
        buildingId: buildingId || undefined,
        status: status ?? undefined,
        plateNumber: plateNumber || undefined,
        driverUserId: driverUserId || undefined,
        reservedFromStart: reservedFromStart || undefined,
        reservedFromEnd: reservedFromEnd || undefined,
        page,
        pageSize,
      },
    })
    return unwrap(res)
  },
  get: async (id) => {
    const res = await api.get(`/api/v1/reservations/${id}`)
    return unwrap(res)
  },
  create: async (payload) => {
    const res = await api.post('/api/v1/reservations', payload)
    return unwrap(res)
  },
  update: async (id, payload) => {
    const res = await api.put(`/api/v1/reservations/${id}`, payload)
    return unwrap(res)
  },
  confirm: async (id) => {
    const res = await api.post(`/api/v1/reservations/${id}/confirm`)
    return unwrap(res)
  },
  cancel: async (id, note) => {
    const res = await api.post(`/api/v1/reservations/${id}/cancel`, { note: note || undefined })
    return unwrap(res)
  },
  checkIn: async (id, parkingSessionId) => {
    const res = await api.post(`/api/v1/reservations/${id}/check-in`, { parkingSessionId })
    return unwrap(res)
  },
  expire: async (id) => {
    const res = await api.post(`/api/v1/reservations/${id}/expire`)
    return unwrap(res)
  },
}
