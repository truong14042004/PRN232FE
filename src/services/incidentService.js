import { api, unwrap } from '../lib/apiClient'

// Quản lý sự cố trong bãi: ghi nhận, cập nhật, xử lý (resolve), hủy (cancel).
export const incidentService = {
  // Danh sách sự cố (lọc theo tòa nhà/trạng thái/loại/biển số/xe/phiên).
  list: async ({
    buildingId,
    status,
    type,
    plateNumber,
    vehicleId,
    parkingSessionId,
    page = 1,
    pageSize = 20,
  } = {}) => {
    const res = await api.get('/api/v1/incidents', {
      params: {
        buildingId: buildingId || undefined,
        status: status ?? undefined,
        type: type ?? undefined,
        plateNumber: plateNumber || undefined,
        vehicleId: vehicleId || undefined,
        parkingSessionId: parkingSessionId || undefined,
        page,
        pageSize,
      },
    })
    return unwrap(res)
  },
  get: async (id) => {
    const res = await api.get(`/api/v1/incidents/${id}`)
    return unwrap(res)
  },
  // Ghi nhận sự cố mới.
  create: async (payload) => {
    const res = await api.post('/api/v1/incidents', payload)
    return unwrap(res)
  },
  // Cập nhật nội dung/loại/trạng thái sự cố.
  update: async (id, payload) => {
    const res = await api.put(`/api/v1/incidents/${id}`, payload)
    return unwrap(res)
  },
  // Xử lý/đóng sự cố kèm ghi chú.
  resolve: async (id, payload) => {
    const res = await api.post(`/api/v1/incidents/${id}/resolve`, payload)
    return unwrap(res)
  },
  // Hủy sự cố (báo nhầm/không hợp lệ).
  cancel: async (id) => {
    const res = await api.post(`/api/v1/incidents/${id}/cancel`)
    return unwrap(res)
  },
}
