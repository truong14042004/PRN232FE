import { api, unwrap } from '../lib/apiClient'

const toParams = ({ from, to } = {}) => ({
  from: from || undefined,
  to: to || undefined,
})

export const reportService = {
  dashboard: async () => {
    const res = await api.get('/api/v1/reports/dashboard')
    return unwrap(res)
  },
  revenue: async (range) => {
    const res = await api.get('/api/v1/reports/revenue', { params: toParams(range) })
    return unwrap(res)
  },
  occupancy: async () => {
    const res = await api.get('/api/v1/reports/occupancy')
    return unwrap(res)
  },
  vehicleFlow: async (range) => {
    const res = await api.get('/api/v1/reports/vehicle-flow', { params: toParams(range) })
    return unwrap(res)
  },
  subscriptions: async (range) => {
    const res = await api.get('/api/v1/reports/subscriptions', { params: toParams(range) })
    return unwrap(res)
  },
  shiftReconciliation: async (range) => {
    const res = await api.get('/api/v1/reports/shift-reconciliation', { params: toParams(range) })
    return unwrap(res)
  },
}
