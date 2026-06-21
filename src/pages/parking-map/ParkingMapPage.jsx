import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Map, Wifi, WifiOff, RefreshCw, Radio } from 'lucide-react'
import toast from 'react-hot-toast'
import { parkingMapService } from '../../services/parkingMapService'
import { useBuildingOptions } from '../../hooks/useOptions'
import { useParkingMapHub, HUB_STATUS } from '../../hooks/useParkingMapHub'
import { SLOT_STATUS } from '../../lib/enums'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card, CardBody } from '../../components/ui/Card'
import Select from '../../components/ui/Select'
import Spinner from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { cn } from '../../lib/cn'
import { formatDateTime } from '../../lib/format'
import ParkingMapGrid from './ParkingMapGrid'

// Chỉ báo trạng thái kết nối realtime.
function LiveBadge({ status }) {
  const map = {
    [HUB_STATUS.Connected]: {
      label: 'Trực tiếp',
      icon: Radio,
      cls: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
      pulse: true,
    },
    [HUB_STATUS.Connecting]: {
      label: 'Đang kết nối...',
      icon: Wifi,
      cls: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    },
    [HUB_STATUS.Reconnecting]: {
      label: 'Đang kết nối lại...',
      icon: Wifi,
      cls: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    },
    [HUB_STATUS.Disconnected]: {
      label: 'Mất kết nối',
      icon: WifiOff,
      cls: 'bg-slate-100 text-slate-500 ring-slate-600/20',
    },
  }
  const cfg = map[status] || map[HUB_STATUS.Disconnected]
  const Icon = cfg.icon
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset',
        cfg.cls,
      )}
    >
      <span className="relative flex h-2 w-2">
        {cfg.pulse && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        )}
        <Icon className="h-3.5 w-3.5" />
      </span>
      {cfg.label}
    </span>
  )
}

export default function ParkingMapPage() {
  const queryClient = useQueryClient()
  const { options: buildingOptions } = useBuildingOptions()
  const [searchParams, setSearchParams] = useSearchParams()
  const [buildingId, setBuildingId] = useState('')
  const [floorId, setFloorId] = useState('')
  const [highlightSlotId, setHighlightSlotId] = useState(null)

  // Nhảy thẳng tới tòa nhà/tầng khi tới từ trang phản hồi "khó tìm xe" (?building=&floor=).
  useEffect(() => {
    const b = searchParams.get('building')
    const f = searchParams.get('floor')
    if (!b && !f) return
    if (b) setBuildingId(b)
    if (f) setFloorId(f)
    searchParams.delete('building')
    searchParams.delete('floor')
    setSearchParams(searchParams, { replace: true })
  }, [searchParams, setSearchParams])

  // Danh sách tầng của tòa nhà (qua parking-map endpoint dành cho map).
  const { data: floors } = useQuery({
    queryKey: ['parking-map', 'floors', buildingId],
    queryFn: () => parkingMapService.buildingFloors(buildingId),
    enabled: !!buildingId,
  })

  const floorOptions = (floors || []).map((f) => ({
    value: f.floorId,
    label: `${f.name} (tầng ${f.floorNumber})`,
  }))

  // Sơ đồ tầng đang xem.
  const {
    data: map,
    isLoading: mapLoading,
    isFetching,
  } = useQuery({
    queryKey: ['parking-map', 'map', floorId],
    queryFn: () => parkingMapService.floorMap(floorId),
    enabled: !!floorId,
  })

  const mapQueryKey = ['parking-map', 'map', floorId]

  // Khi nhận event realtime: cập nhật ô tương ứng trong cache, không refetch.
  const handleSlotChange = useCallback(
    (event) => {
      if (!event?.slotId) return
      setHighlightSlotId(event.slotId)
      // Tắt highlight sau 1.2s.
      setTimeout(() => setHighlightSlotId((cur) => (cur === event.slotId ? null : cur)), 1200)

      queryClient.setQueryData(mapQueryKey, (old) => {
        if (!old?.slots) return old
        const slots = old.slots.map((s) =>
          s.slotId === event.slotId
            ? { ...s, status: event.status, vehicle: event.vehicle ?? null }
            : s,
        )
        // Tính lại tóm tắt.
        const summary = {
          total: slots.length,
          available: slots.filter((s) => s.status === 1).length,
          occupied: slots.filter((s) => s.status === 2).length,
          reserved: slots.filter((s) => s.status === 3).length,
          maintenance: slots.filter((s) => s.status === 4).length,
        }
        return { ...old, slots, summary }
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryClient, floorId],
  )

  const { status: hubStatus } = useParkingMapHub(floorId || null, handleSlotChange)

  // Chọn tầng đầu tiên khi đổi tòa nhà.
  useEffect(() => {
    if (floors?.length && !floorId) {
      setFloorId(floors[0].floorId)
    }
  }, [floors, floorId])

  const summary = map?.summary

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['parking-map', 'map', floorId] })
    toast.success('Đã làm mới sơ đồ')
  }

  return (
    <div>
      <PageHeader
        title="Sơ đồ bãi đỗ"
        description="Theo dõi tình trạng chỗ đỗ theo thời gian thực."
        icon={Map}
        actions={<LiveBadge status={hubStatus} />}
      />

      {/* Bộ chọn tòa nhà + tầng */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <Select
              label="Tòa nhà"
              value={buildingId}
              onChange={(e) => {
                setBuildingId(e.target.value)
                setFloorId('')
              }}
              placeholder="Chọn tòa nhà"
              options={buildingOptions}
              containerClassName="w-full sm:w-64"
            />
            <Select
              label="Tầng"
              value={floorId}
              onChange={(e) => setFloorId(e.target.value)}
              placeholder={buildingId ? 'Chọn tầng' : 'Chọn tòa nhà trước'}
              options={floorOptions}
              disabled={!buildingId}
              containerClassName="w-full sm:w-64"
            />
            {floorId && (
              <button
                onClick={refresh}
                className="btn-secondary sm:w-auto"
                title="Làm mới"
              >
                <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
                Làm mới
              </button>
            )}
          </div>
        </CardBody>
      </Card>

      {!buildingId ? (
        <EmptyState
          title="Chọn tòa nhà để xem sơ đồ"
          description="Chọn tòa nhà và tầng để hiển thị sơ đồ bãi đỗ theo thời gian thực."
          icon={Map}
        />
      ) : !floorId ? (
        <EmptyState
          title="Tòa nhà chưa có tầng"
          description="Tạo tầng và chỗ đỗ cho tòa nhà này trước."
          icon={Map}
        />
      ) : mapLoading ? (
        <Spinner label="Đang tải sơ đồ bãi..." />
      ) : !map?.slots?.length ? (
        <EmptyState
          title="Tầng này chưa có chỗ đỗ"
          description="Vào trang Chỗ đỗ để thêm hoặc sinh lưới chỗ đỗ cho tầng này."
          icon={Map}
        />
      ) : (
        <div className="space-y-6">
          {/* Tóm tắt nhanh */}
          {summary && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <SummaryTile label="Tổng" value={summary.total} cls="bg-slate-100 text-slate-700" />
              <SummaryTile label="Trống" value={summary.available} cls="bg-emerald-50 text-emerald-700" />
              <SummaryTile label="Đang đỗ" value={summary.occupied} cls="bg-blue-50 text-blue-700" />
              <SummaryTile label="Đã đặt" value={summary.reserved} cls="bg-amber-50 text-amber-700" />
              <SummaryTile label="Bảo trì" value={summary.maintenance} cls="bg-red-50 text-red-700" />
            </div>
          )}

          {/* Sơ đồ */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardBody>
                {/* Chú thích màu */}
                <div className="mb-4 flex flex-wrap items-center gap-4">
                  {Object.entries(SLOT_STATUS).map(([val, meta]) => (
                    <span key={val} className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                      <span className={cn('h-3 w-3 rounded-full', meta.dot)} />
                      {meta.label}
                    </span>
                  ))}
                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                    <span className="h-2 w-2 rounded-full bg-violet-500" />
                    Vé tháng
                  </span>
                </div>

                <ParkingMapGrid map={map} highlightSlotId={highlightSlotId} />
              </CardBody>
            </Card>
          </motion.div>

          {map?.generatedAt && (
            <p className="text-center text-xs text-slate-400">
              Cập nhật lúc {formatDateTime(map.generatedAt)}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function SummaryTile({ label, value, cls }) {
  return (
    <div className={cn('rounded-xl px-4 py-3', cls)}>
      <p className="text-xs font-medium opacity-80">{label}</p>
      <p className="mt-0.5 text-2xl font-bold">{value ?? 0}</p>
    </div>
  )
}
