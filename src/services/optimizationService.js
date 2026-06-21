import { api, unwrap } from '../lib/apiClient'

export const optimizationService = {
  // Số liệu sử dụng bãi đỗ (Manager).
  getMetrics: async (buildingId) => {
    const res = await api.get('/api/v1/optimization/metrics', {
      params: { buildingId },
    })
    return unwrap(res)
  },
  // Số liệu + phân tích AI trả lời RQ1–RQ4 (Manager).
  analyze: async (buildingId) => {
    const res = await api.post('/api/v1/optimization/analyze', { buildingId })
    return unwrap(res)
  },
  // Gợi ý slot tốt nhất cho một zone + loại xe (Staff/Manager).
  suggestSlot: async ({ zoneId, vehicleTypeId, topN = 5 }) => {
    const res = await api.get('/api/v1/optimization/suggest-slot', {
      params: { zoneId, vehicleTypeId, topN },
    })
    return unwrap(res)
  },
}
