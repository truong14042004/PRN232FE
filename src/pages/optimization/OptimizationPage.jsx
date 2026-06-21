import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Sparkles,
  Gauge,
  Layers,
  Car,
  Clock,
  Building2,
  Loader2,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  Legend,
} from 'recharts'
import { buildingService } from '../../services/buildingService'
import { optimizationService } from '../../services/optimizationService'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card, CardHeader, CardTitle, CardBody, StatCard } from '../../components/ui/Card'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { getErrorMessage } from '../../lib/apiClient'
import { formatPercent } from '../../lib/format'

const BAR_COLOR = (rate) =>
  rate >= 80 ? '#ef4444' : rate >= 50 ? '#f59e0b' : '#10b981'

// Bảng màu cho các loại phương tiện trong biểu đồ giờ cao điểm.
const TYPE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6']

// Chuyển hourlyByVehicleType -> data phẳng cho stacked bar, và trả về danh sách loại xe.
function buildHourlyTypeData(hourly) {
  if (!hourly?.length) return { data: [], types: [] }
  const typeSet = new Set()
  hourly.forEach((h) => Object.keys(h.countsByVehicleType || {}).forEach((t) => typeSet.add(t)))
  const types = [...typeSet]
  const data = hourly.map((h) => {
    const row = { hour: h.hour }
    types.forEach((t) => {
      row[t] = h.countsByVehicleType?.[t] || 0
    })
    return row
  })
  return { data, types }
}

// Render markdown tối giản (heading ###, **bold**, danh sách -, đoạn văn) — đủ cho phân tích AI.
function renderAnalysis(text) {
  const lines = text.split('\n')
  const out = []
  lines.forEach((raw, i) => {
    const line = raw.trimEnd()
    if (!line.trim()) return
    const bold = (s) =>
      s.split(/(\*\*[^*]+\*\*)/g).map((seg, j) =>
        seg.startsWith('**') && seg.endsWith('**') ? (
          <strong key={j} className="font-semibold text-slate-800">
            {seg.slice(2, -2)}
          </strong>
        ) : (
          <span key={j}>{seg}</span>
        ),
      )
    if (line.startsWith('### ')) {
      out.push(
        <h3 key={i} className="mt-4 mb-1 text-sm font-bold text-indigo-700">
          {line.slice(4)}
        </h3>,
      )
    } else if (line.startsWith('## ')) {
      out.push(
        <h2 key={i} className="mt-4 mb-1 text-base font-bold text-slate-800">
          {line.slice(3)}
        </h2>,
      )
    } else if (/^[-*]\s/.test(line.trim())) {
      out.push(
        <li key={i} className="ml-5 list-disc text-sm text-slate-600">
          {bold(line.trim().replace(/^[-*]\s/, ''))}
        </li>,
      )
    } else {
      out.push(
        <p key={i} className="text-sm leading-relaxed text-slate-600">
          {bold(line)}
        </p>,
      )
    }
  })
  return out
}

export default function OptimizationPage() {
  const [buildingId, setBuildingId] = useState('')

  const buildingsQuery = useQuery({
    queryKey: ['buildings', 'options'],
    queryFn: () => buildingService.list({ isActive: true, pageSize: 200 }),
  })
  const buildingOptions = (buildingsQuery.data?.items || []).map((b) => ({
    value: b.id,
    label: b.name,
  }))

  const metricsQuery = useQuery({
    queryKey: ['optimization', 'metrics', buildingId],
    queryFn: () => optimizationService.getMetrics(buildingId),
    enabled: !!buildingId,
  })

  const analyzeMutation = useMutation({
    mutationFn: () => optimizationService.analyze(buildingId),
  })

  const m = metricsQuery.data

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tối ưu bãi xe"
        description="Phân tích hiệu quả sử dụng chỗ đỗ và gợi ý tối ưu bằng AI (RQ1–RQ4)."
        icon={Sparkles}
      />

      <Card>
        <CardBody>
          <div className="flex flex-wrap items-end gap-3">
            <Select
              label="Tòa nhà"
              placeholder="Chọn tòa nhà"
              options={buildingOptions}
              value={buildingId}
              onChange={(e) => {
                setBuildingId(e.target.value)
                analyzeMutation.reset()
              }}
              containerClassName="min-w-[220px]"
            />
            <Button
              onClick={() => analyzeMutation.mutate()}
              disabled={!buildingId}
              loading={analyzeMutation.isPending}
            >
              <Sparkles className="h-4 w-4" />
              Phân tích bằng AI
            </Button>
          </div>
        </CardBody>
      </Card>

      {!buildingId && (
        <EmptyState
          icon={Building2}
          title="Chọn tòa nhà để bắt đầu"
          description="Số liệu sử dụng bãi và phân tích AI sẽ hiển thị tại đây."
        />
      )}

      {buildingId && metricsQuery.isLoading && (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      )}

      {m && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              icon={Gauge}
              label="Tỷ lệ lấp đầy"
              value={formatPercent(m.occupancyRate / 100)}
              hint={`${m.occupiedSlots}/${m.totalSlots} chỗ`}
            />
            <StatCard icon={Layers} label="Tổng số chỗ" value={m.totalSlots} />
            <StatCard icon={Car} label="Đang đỗ" value={m.occupiedSlots} />
            <StatCard icon={Clock} label="Phiên hoạt động" value={m.activeSessions} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Tỷ lệ lấp đầy theo tầng</CardTitle>
              </CardHeader>
              <CardBody>
                {m.floors.length === 0 ? (
                  <EmptyState title="Chưa có tầng" />
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={m.floors}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="floorName" fontSize={12} />
                      <YAxis unit="%" fontSize={12} />
                      <Tooltip formatter={(v) => `${v}%`} />
                      <Bar dataKey="occupancyRate" radius={[6, 6, 0, 0]}>
                        {m.floors.map((f, i) => (
                          <Cell key={i} fill={BAR_COLOR(f.occupancyRate)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tỷ lệ lấp đầy theo khu vực</CardTitle>
              </CardHeader>
              <CardBody>
                {m.zones.length === 0 ? (
                  <EmptyState title="Chưa có khu vực" />
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={m.zones}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="zoneName" fontSize={12} />
                      <YAxis unit="%" fontSize={12} />
                      <Tooltip formatter={(v) => `${v}%`} />
                      <Bar dataKey="occupancyRate" radius={[6, 6, 0, 0]}>
                        {m.zones.map((z, i) => (
                          <Cell key={i} fill={BAR_COLOR(z.occupancyRate)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lưu lượng xe vào theo giờ</CardTitle>
            </CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={m.hourlyCheckIns}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="hour" fontSize={12} tickFormatter={(h) => `${h}h`} />
                  <YAxis allowDecimals={false} fontSize={12} />
                  <Tooltip labelFormatter={(h) => `${h}h`} formatter={(v) => [`${v} lượt`, 'Xe vào']} />
                  <Bar dataKey="checkIns" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>

          {/* Giờ cao điểm theo loại phương tiện */}
          {(() => {
            const { data: htData, types: htTypes } = buildHourlyTypeData(m.hourlyByVehicleType)
            const hasData = htData.some((row) => htTypes.some((t) => row[t] > 0))
            return (
              <Card>
                <CardHeader>
                  <CardTitle>Giờ cao điểm theo loại phương tiện</CardTitle>
                </CardHeader>
                <CardBody>
                  {!hasData ? (
                    <EmptyState title="Chưa có dữ liệu lượt vào theo loại xe" />
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={htData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="hour" fontSize={12} tickFormatter={(h) => `${h}h`} />
                        <YAxis allowDecimals={false} fontSize={12} />
                        <Tooltip labelFormatter={(h) => `${h}h`} />
                        <Legend />
                        {htTypes.map((t, i) => (
                          <Bar
                            key={t}
                            dataKey={t}
                            stackId="vt"
                            fill={TYPE_COLORS[i % TYPE_COLORS.length]}
                            radius={i === htTypes.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardBody>
              </Card>
            )
          })()}
        </>
      )}

      {/* Phân tích AI */}
      {analyzeMutation.isPending && (
        <Card>
          <CardBody>
            <div className="flex items-center gap-3 py-6 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
              AI đang phân tích số liệu, vui lòng đợi...
            </div>
          </CardBody>
        </Card>
      )}

      {analyzeMutation.isError && (
        <Card>
          <CardBody>
            <p className="text-sm text-red-600">
              {getErrorMessage(analyzeMutation.error, 'Phân tích thất bại')}
            </p>
          </CardBody>
        </Card>
      )}

      {analyzeMutation.data && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader>
              <CardTitle>
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-500" />
                  Phân tích & khuyến nghị (AI)
                </span>
              </CardTitle>
            </CardHeader>
            <CardBody>
              {!analyzeMutation.data.aiAvailable && (
                <div className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  Không kết nối được AI. Hiển thị thông báo hệ thống bên dưới.
                </div>
              )}
              <div className="space-y-1">{renderAnalysis(analyzeMutation.data.analysis)}</div>
            </CardBody>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
