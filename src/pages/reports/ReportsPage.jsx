import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  BarChart3,
  Wallet,
  Receipt,
  ArrowDownToLine,
  ArrowUpFromLine,
  CalendarClock,
  Gauge,
  RefreshCw,
  Clock,
  Car,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts'
import { reportService } from '../../services/reportService'
import { useVehicleTypeOptions } from '../../hooks/useOptions'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card, CardHeader, CardTitle, CardBody, StatCard } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Spinner from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { formatCurrency, formatNumber, formatPercent, toDateInput } from '../../lib/format'

// Mặc định: 30 ngày gần nhất.
const defaultFrom = () => {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return toDateInput(d)
}

export default function ReportsPage() {
  const [from, setFrom] = useState(defaultFrom())
  const [to, setTo] = useState(toDateInput(new Date()))
  const [range, setRange] = useState({ from: defaultFrom(), to: toDateInput(new Date()) })

  const toIso = (v, endOfDay = false) => {
    if (!v) return undefined
    return endOfDay ? `${v}T23:59:59` : `${v}T00:00:00`
  }

  const params = { from: toIso(range.from), to: toIso(range.to, true) }

  const revenueQuery = useQuery({
    queryKey: ['reports', 'revenue', params],
    queryFn: () => reportService.revenue(params),
  })
  const vehicleFlowQuery = useQuery({
    queryKey: ['reports', 'vehicle-flow', params],
    queryFn: () => reportService.vehicleFlow(params),
  })
  const subscriptionsQuery = useQuery({
    queryKey: ['reports', 'subscriptions', params],
    queryFn: () => reportService.subscriptions(params),
  })
  const occupancyQuery = useQuery({
    queryKey: ['reports', 'occupancy-full'],
    queryFn: reportService.occupancy,
  })

  const applyRange = () => setRange({ from, to })

  const rev = revenueQuery.data
  const flow = vehicleFlowQuery.data
  const subs = subscriptionsQuery.data
  const occ = occupancyQuery.data

  const occBars = occ
    ? [
        { name: 'Trống', value: occ.availableSlots },
        { name: 'Đang đỗ', value: occ.occupiedSlots },
        { name: 'Đã đặt', value: occ.reservedSlots },
        { name: 'Bảo trì', value: occ.maintenanceSlots },
      ]
    : []

  // Map id loại xe → tên để hiển thị thay vì id thô.
  const { options: vehicleTypeOptions } = useVehicleTypeOptions()
  const vehicleTypeName = (id) =>
    vehicleTypeOptions.find((o) => o.value === id)?.label || 'Khác'

  // Khung giờ cao điểm: chuẩn hóa nhãn "00h"–"23h".
  const peakData = (flow?.peakHours || []).map((b) => ({
    label: `${String(b.hour).padStart(2, '0')}h`,
    checkIns: b.checkIns,
    checkOuts: b.checkOuts,
  }))
  // Giờ cao điểm nhất theo lượt vào.
  const busiest = (flow?.peakHours || []).reduce(
    (max, b) => (b.checkIns > (max?.checkIns ?? -1) ? b : max),
    null,
  )

  // Lưu lượng theo loại xe.
  const byTypeData = (flow?.byVehicleType || []).map((v) => ({
    name: vehicleTypeName(v.vehicleTypeId),
    checkIns: v.checkIns,
    checkOuts: v.checkOuts,
  }))

  const loading =
    revenueQuery.isLoading || vehicleFlowQuery.isLoading || subscriptionsQuery.isLoading

  return (
    <div>
      <PageHeader
        title="Báo cáo"
        description="Phân tích doanh thu, lưu lượng xe và vé tháng theo khoảng thời gian."
        icon={BarChart3}
      />

      {/* Bộ lọc khoảng ngày */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-col items-end gap-4 sm:flex-row">
            <Input
              type="date"
              label="Từ ngày"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              containerClassName="w-full sm:w-auto"
            />
            <Input
              type="date"
              label="Đến ngày"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              containerClassName="w-full sm:w-auto"
            />
            <Button onClick={applyRange} className="w-full sm:w-auto">
              <RefreshCw className="h-4 w-4" />
              Áp dụng
            </Button>
          </div>
        </CardBody>
      </Card>

      {loading ? (
        <Spinner label="Đang tải báo cáo..." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={Wallet}
              label="Tổng doanh thu"
              value={formatCurrency(rev?.totalRevenue)}
              accent="emerald"
              delay={0}
            />
            <StatCard
              icon={Receipt}
              label="Số giao dịch"
              value={formatNumber(rev?.totalPayments)}
              accent="brand"
              delay={0.06}
            />
            <StatCard
              icon={ArrowDownToLine}
              label="Lượt xe vào"
              value={formatNumber(flow?.checkIns)}
              accent="violet"
              delay={0.12}
            />
            <StatCard
              icon={ArrowUpFromLine}
              label="Lượt xe ra"
              value={formatNumber(flow?.checkOuts)}
              accent="amber"
              delay={0.18}
            />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Hiện trạng chỗ đỗ</CardTitle>
                  <Gauge className="h-5 w-5 text-slate-300" />
                </CardHeader>
                <CardBody>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={occBars} margin={{ left: -16, right: 8, top: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }}
                        formatter={(v) => [formatNumber(v), 'Số chỗ']}
                        cursor={{ fill: '#f8fafc' }}
                      />
                      <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} maxBarSize={64} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="text-sm text-slate-500">Tỉ lệ lấp đầy</span>
                    <span className="text-lg font-bold text-brand-600">
                      {formatPercent(occ?.occupancyRate)}
                    </span>
                  </div>
                </CardBody>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.16 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Vé tháng</CardTitle>
                  <CalendarClock className="h-5 w-5 text-slate-300" />
                </CardHeader>
                <CardBody className="space-y-3">
                  <Row label="Đang hiệu lực" value={formatNumber(subs?.activeSubscriptions)} accent="text-emerald-600" />
                  <Row label="Sắp hết hạn" value={formatNumber(subs?.expiringSubscriptions)} accent="text-amber-600" />
                  <Row label="Đã hết hạn" value={formatNumber(subs?.expiredSubscriptions)} accent="text-slate-500" />
                  <div className="flex items-center justify-between rounded-xl bg-violet-50/60 px-4 py-3">
                    <span className="text-sm font-medium text-violet-700">Doanh thu định kỳ hàng tháng</span>
                    <span className="text-lg font-bold text-violet-900">
                      {formatCurrency(subs?.monthlyRecurringRevenue)}
                    </span>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          </div>

          {/* Khung giờ cao điểm */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mt-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>Khung giờ cao điểm</CardTitle>
                <div className="flex items-center gap-3">
                  {busiest && (busiest.checkIns > 0 || busiest.checkOuts > 0) && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                      <Clock className="h-3.5 w-3.5" />
                      Đông nhất: {String(busiest.hour).padStart(2, '0')}h ({formatNumber(busiest.checkIns)} lượt vào)
                    </span>
                  )}
                  <Clock className="h-5 w-5 text-slate-300" />
                </div>
              </CardHeader>
              <CardBody>
                {peakData.some((d) => d.checkIns > 0 || d.checkOuts > 0) ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={peakData} margin={{ left: -16, right: 8, top: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval={1} />
                      <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }}
                        cursor={{ stroke: '#e2e8f0' }}
                      />
                      <Legend wrapperStyle={{ fontSize: 13 }} />
                      <Line type="monotone" dataKey="checkIns" name="Lượt vào" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="checkOuts" name="Lượt ra" stroke="#f59e0b" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState
                    icon={Clock}
                    title="Chưa có dữ liệu lưu lượng"
                    description="Không có lượt vào/ra trong khoảng thời gian đã chọn."
                  />
                )}
                <p className="mt-2 text-center text-xs text-slate-400">Theo giờ trong ngày (giờ địa phương GMT+7)</p>
              </CardBody>
            </Card>
          </motion.div>

          {/* Lưu lượng theo loại phương tiện */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.26 }}
            className="mt-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>Lưu lượng theo loại phương tiện</CardTitle>
                <Car className="h-5 w-5 text-slate-300" />
              </CardHeader>
              <CardBody>
                {byTypeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={Math.max(160, byTypeData.length * 56)}>
                    <BarChart data={byTypeData} layout="vertical" margin={{ left: 24, right: 16, top: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#475569' }} axisLine={false} tickLine={false} width={100} />
                      <Tooltip
                        contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }}
                        cursor={{ fill: '#f8fafc' }}
                      />
                      <Legend wrapperStyle={{ fontSize: 13 }} />
                      <Bar dataKey="checkIns" name="Lượt vào" fill="#8b5cf6" radius={[0, 6, 6, 0]} maxBarSize={28} />
                      <Bar dataKey="checkOuts" name="Lượt ra" fill="#f59e0b" radius={[0, 6, 6, 0]} maxBarSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState
                    icon={Car}
                    title="Chưa có dữ liệu theo loại xe"
                    description="Không có lượt gửi xe trong khoảng thời gian đã chọn."
                  />
                )}
              </CardBody>
            </Card>
          </motion.div>
        </>
      )}
    </div>
  )
}

function Row({ label, value, accent }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0">
      <span className="text-sm text-slate-600">{label}</span>
      <span className={`text-lg font-bold ${accent}`}>{value}</span>
    </div>
  )
}
