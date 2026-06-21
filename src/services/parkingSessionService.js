import { api, unwrap } from '../lib/apiClient'

export const parkingSessionService = {
  list: async ({ buildingId, status, plateNumber, fromDate, toDate, page = 1, pageSize = 20 } = {}) => {
    const res = await api.get('/api/v1/parking-sessions', {
      params: {
        buildingId: buildingId || undefined,
        status: status ?? undefined,
        plateNumber: plateNumber || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        page,
        pageSize,
      },
    })
    return unwrap(res)
  },
  my: async ({ page = 1, pageSize = 50 } = {}) => {
    const res = await api.get('/api/v1/parking-sessions/my', {
      params: { page, pageSize },
    })
    return unwrap(res)
  },
  get: async (id) => {
    const res = await api.get(`/api/v1/parking-sessions/${id}`)
    return unwrap(res)
  },
  // Phí tạm tính cho phiên đang gửi (Active). BE tự xử lý vé tháng + kiểm tra
  // quyền sở hữu cho Driver, nên dùng endpoint này thay vì gọi vòng fee-policies/calculate.
  estimateFee: async (id) => {
    const res = await api.get(`/api/v1/parking-sessions/${id}/estimate-fee`)
    return unwrap(res)
  },
  activeByPlate: async (plateNumber) => {
    const res = await api.get(`/api/v1/parking-sessions/active/by-plate/${plateNumber}`)
    return unwrap(res)
  },
  checkIn: async (payload) => {
    const res = await api.post('/api/v1/parking-sessions/check-in', payload)
    return unwrap(res)
  },
  checkOut: async (id, payload) => {
    const res = await api.post(`/api/v1/parking-sessions/${id}/check-out`, payload)
    return unwrap(res)
  },
  changeSlot: async (id, newParkingSlotId) => {
    const res = await api.post(`/api/v1/parking-sessions/${id}/change-slot`, { newParkingSlotId })
    return unwrap(res)
  },
  updateInfo: async (id, payload) => {
    const res = await api.post(`/api/v1/parking-sessions/${id}/update-info`, payload)
    return unwrap(res)
  },
  markException: async (id, note) => {
    const res = await api.post(`/api/v1/parking-sessions/${id}/mark-exception`, { note })
    return unwrap(res)
  },
}
