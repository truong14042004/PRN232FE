import { api, unwrap } from '../lib/apiClient'

export const feedbackService = {
  // Driver gửi phản hồi.
  create: async (payload) => {
    const res = await api.post('/api/v1/feedback', payload)
    return unwrap(res)
  },
  // Phản hồi của chính mình.
  my: async ({ page = 1, pageSize = 50 } = {}) => {
    const res = await api.get('/api/v1/feedback/my', { params: { page, pageSize } })
    return unwrap(res)
  },
  // Quản lý xem tất cả.
  list: async ({ buildingId, status, type, page = 1, pageSize = 20 } = {}) => {
    const res = await api.get('/api/v1/feedback', {
      params: {
        buildingId: buildingId || undefined,
        status: status ?? undefined,
        type: type ?? undefined,
        page,
        pageSize,
      },
    })
    return unwrap(res)
  },
  // Quản lý trả lời.
  respond: async (id, payload) => {
    const res = await api.post(`/api/v1/feedback/${id}/respond`, payload)
    return unwrap(res)
  },
}
