import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Car,
  ParkingSquare,
  CircleParking,
  Activity,
  CalendarClock,
  Wallet,
  Gauge,
  ArrowDownToLine,
  ArrowUpFromLine,
  TrendingUp,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { reportService } from '../services/reportService'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardHeader, CardTitle, CardBody, StatCard } from '../components/ui/Card'
import Spinner from '../components/ui/Spinner'
import { EmptyState } from '../components/ui/EmptyState'
import { formatCurrency, formatNumber, formatPercent } from '../lib/format'

const OCCUPANCY_COLORS = {
  available: '#10b981',
  occupied: '#3b82f6',
  reserved: '#f59e0b',
  maintenance: '#ef4444',
}

export default function DashboardPage() {
  const dashboardQuery = useQuery({
    queryKey: ['reports', 'dashboard'],
    queryFn: reportService.dashboard,
  })
  const occupancyQuery = useQuery({
    queryKey: ['reports', 'occupancy'],
    queryFn: reportService.occupancy,
  })
  const vehicleFlowQuery = useQuery({
    queryKey: ['reports', 'vehicle-flow'],
    queryFn: () => reportService.vehicleFlow(),
  })
  const subscriptionsQuery = useQuery({
    queryKey: ['reports', 'subscriptions-summary'],
    queryFn: () => reportService.subscriptions(),
  })

  const d = dashboardQuery.data
  const occ = occupancyQuery.data
  const flow = vehicleFlowQuery.data
  const subs = subscriptionsQuery.data

  if (dashboardQuery.isLoading) {
    return <Spinner label="Đang tải dữ liệu tổng quan..." />
  }

  if (dashboardQuery.isError) {
    return (
      <EmptyState
        title="Không tải được dữ liệu"
        description="Báo cáo cần dịch vụ Report (cổng 5004) hoạt động. Kiểm tra backend rồi thử lại."
        icon={Activity}
      />
    )
  }

  const occupancyPie = occ
    ? [
        { name: 'Còn trống', value: occ.availableSlots, key: 'available' },
        { name: 'Đang đỗ', value: occ.occupiedSlots, key: 'occupied' },
        { name: 'Đã đặt', value: occ.reservedSlots, key: 'reserved' },
        { name: 'Bảo trì', value: occ.maintenanceSlots, key: 'maintenance' },
      ].filter((s) => s.value > 0)
    : []

  const flowData = flow
    ? [
        { name: 'Xe vào', value: flow.checkIns },
        { name: 'Xe ra', value: flow.checkOuts },
      ]
    : []

  return (
    <div>
      <PageHeader
        title="Tổng quan"
        description="Bức tranh nhanh về tình hình vận hành bãi đỗ xe hôm nay."
        icon={LayoutDashboard}
      />

      {/* Hàng chỉ số chính */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Wallet}
          label="Doanh thu hôm nay"
          value={formatCurrency(d?.todayRevenue)}
          accent="emerald"
          delay={0}
        />
        <StatCard
          icon={Activity}
          label="Phiên đang hoạt động"
          value={formatNumber(d?.activeSessions)}
          hint="Xe đang trong bãi"
          accent="brand"
          delay={0.06}
        />
        <StatCard
          icon={CalendarClock}
          label="Vé tháng hiệu lực"
          value={formatNumber(d?.activeSubscriptions)}
          accent="violet"
          delay={0.12}
        />
        <StatCard
          icon={Gauge}
          label="Tỉ lệ lấp đầy"
          value={formatPercent(d?.occupancyRate)}
          hint={`${formatNumber(d?.occupiedSlots)}/${formatNumber(d?.totalSlots)} chỗ`}
          accent="amber"
          delay={0.18}
        />
      </div>

      {/* Hàng chỉ số phụ */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={ParkingSquare}
          label="Tổng số chỗ đỗ"
          value={formatNumber(d?.totalSlots)}
          accent="brand"
          delay={0.24}
        />
        <StatCard
          icon={CircleParking}
          label="Chỗ còn trống"
          value={formatNumber(d?.availableSlots)}
          accent="emerald"
          delay={0.3}
        />
        <StatCard
          icon={Car}
          label="Chỗ đang dùng"
          value={formatNumber(d?.occupiedSlots)}
          accent="rose"
          delay={0.36}
        />
      </div>

      {/* Biểu đồ */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle>Lưu lượng xe (30 ngày gần nhất)</CardTitle>
              <ArrowDownToLine className="h-5 w-5 text-slate-300" />
            </CardHeader>
            <CardBody>
              {flowData.length ? (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={flowData} margin={{ left: -16, right: 8, top: 8 }}>
                    <defs>
                      <linearGradient id="flowGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid #e2e8f0',
                        fontSize: 13,
                        boxShadow: '0 8px 24px -8px rgb(0 0 0 / 0.15)',
                      }}
                      formatter={(v) => [formatNumber(v), 'Số xe']}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      fill="url(#flowGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[280px] items-center justify-center">
                  <EmptyState title="Chưa có dữ liệu lưu lượng" icon={Car} />
                </div>
              )}
              {flow && (
                <div className="mt-2 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <ArrowDownToLine className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Tổng xe vào</p>
                      <p className="text-lg font-bold text-slate-900">{formatNumber(flow.checkIns)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <ArrowUpFromLine className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Tổng xe ra</p>
                      <p className="text-lg font-bold text-slate-900">{formatNumber(flow.checkOuts)}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.28 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Phân bổ chỗ đỗ</CardTitle>
              <CircleParking className="h-5 w-5 text-slate-300" />
            </CardHeader>
            <CardBody>
              {occupancyPie.length ? (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={occupancyPie}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={56}
                      outerRadius={88}
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {occupancyPie.map((entry) => (
                        <Cell key={entry.key} fill={OCCUPANCY_COLORS[entry.key]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }}
                      formatter={(v, n) => [formatNumber(v), n]}
                    />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[240px] items-center justify-center">
                  <EmptyState title="Chưa có dữ liệu chỗ đỗ" icon={ParkingSquare} />
                </div>
              )}
            </CardBody>
          </Card>
        </motion.div>
      </div>

      {/* Tóm tắt vé tháng */}
      {subs && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.34 }}
          className="mt-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>Tình hình vé tháng</CardTitle>
              <TrendingUp className="h-5 w-5 text-slate-300" />
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-xl bg-emerald-50/60 p-4">
                  <p className="text-xs font-medium text-emerald-700">Đang hiệu lực</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-900">
                    {formatNumber(subs.activeSubscriptions)}
                  </p>
                </div>
                <div className="rounded-xl bg-amber-50/60 p-4">
                  <p className="text-xs font-medium text-amber-700">Sắp hết hạn</p>
                  <p className="mt-1 text-2xl font-bold text-amber-900">
                    {formatNumber(subs.expiringSubscriptions)}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-100/80 p-4">
                  <p className="text-xs font-medium text-slate-600">Đã hết hạn</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {formatNumber(subs.expiredSubscriptions)}
                  </p>
                </div>
                <div className="rounded-xl bg-violet-50/60 p-4">
                  <p className="text-xs font-medium text-violet-700">Doanh thu định kỳ</p>
                  <p className="mt-1 text-xl font-bold text-violet-900">
                    {formatCurrency(subs.monthlyRecurringRevenue)}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
