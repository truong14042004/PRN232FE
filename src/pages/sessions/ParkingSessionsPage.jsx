import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  LogIn,
  Search,
  LogOut,
  Replace,
  Clock,
  RotateCcw,
  Eye,
  Pencil,
  AlertTriangle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { parkingSessionService } from '../../services/parkingSessionService'
import { SESSION_STATUS, SESSION_STATUS_OPTIONS } from '../../lib/enums'
import { useBuildingOptions } from '../../hooks/useOptions'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card, CardBody } from '../../components/ui/Card'
import { Table } from '../../components/ui/Table'
import { Pagination } from '../../components/ui/Pagination'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import { formatDateTime, formatCurrency } from '../../lib/format'
import CheckInModal from './CheckInModal'
import CheckOutModal from './CheckOutModal'
import ChangeSlotModal from './ChangeSlotModal'
import SessionDetailModal from './SessionDetailModal'
import UpdateInfoModal from './UpdateInfoModal'
import MarkExceptionModal from './MarkExceptionModal'

// Phiên đang gửi quá lâu (ngưỡng giờ) được coi là quá hạn → cảnh báo.
const OVERTIME_HOURS = 24
function isOvertime(session) {
  if (session.status !== 1 || !session.checkInTime) return false
  const hours = (Date.now() - new Date(session.checkInTime).getTime()) / 3_600_000
  return hours >= OVERTIME_HOURS
}

export default function ParkingSessionsPage() {
  const queryClient = useQueryClient()
  const { options: buildingOptions } = useBuildingOptions()
  const [searchParams, setSearchParams] = useSearchParams()

  const [page, setPage] = useState(1)
  const [buildingId, setBuildingId] = useState('')
  const [status, setStatus] = useState('')
  const [plateNumber, setPlateNumber] = useState('')
  const [plateInput, setPlateInput] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const [checkInOpen, setCheckInOpen] = useState(false)
  const [checkOutTarget, setCheckOutTarget] = useState(null)
  const [checkOutLostTicket, setCheckOutLostTicket] = useState(false)
  const [changeSlotTarget, setChangeSlotTarget] = useState(null)
  const [updateInfoTarget, setUpdateInfoTarget] = useState(null)
  const [exceptionTarget, setExceptionTarget] = useState(null)
  const [detailId, setDetailId] = useState(null)

  // Hành động cần tự mở sau khi tải được phiên (đến từ trang phản hồi: ?action=checkout|changeslot).
  const [pendingAction, setPendingAction] = useState(null)

  // Khi điều hướng từ trang phản hồi (?plate=...&action=...), tự lọc theo biển số và ghi nhớ hành động.
  useEffect(() => {
    const plate = searchParams.get('plate')
    if (!plate) return
    setPlateInput(plate)
    setPlateNumber(plate)
    setPage(1)
    const action = searchParams.get('action')
    if (action) setPendingAction({ plate, action, lostTicket: searchParams.get('lostTicket') })
    searchParams.delete('plate')
    searchParams.delete('action')
    searchParams.delete('lostTicket')
    setSearchParams(searchParams, { replace: true })
  }, [searchParams, setSearchParams])


  const filters = {
    buildingId: buildingId || undefined,
    status: status === '' ? undefined : Number(status),
    plateNumber: plateNumber || undefined,
    fromDate: fromDate ? `${fromDate}T00:00:00` : undefined,
    toDate: toDate ? `${toDate}T23:59:59` : undefined,
    page,
    pageSize: 20,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['parking-sessions', filters],
    queryFn: () => parkingSessionService.list(filters),
  })

  // Tự mở đúng modal cho phiên đang gửi khớp biển số khi tới từ trang phản hồi.
  useEffect(() => {
    if (!pendingAction || !data?.items) return
    const target = data.items.find(
      (s) => s.status === 1 && s.plateNumber === pendingAction.plate,
    )
    if (!target) {
      toast.error(`Không tìm thấy phiên đang gửi cho biển số ${pendingAction.plate}`)
      setPendingAction(null)
      return
    }
    if (pendingAction.action === 'checkout') {
      setCheckOutLostTicket(pendingAction.lostTicket === '1')
      setCheckOutTarget(target)
    } else if (pendingAction.action === 'changeslot') {
      setChangeSlotTarget(target)
    }
    setPendingAction(null)
  }, [pendingAction, data])

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['parking-sessions'] })

  const applySearch = () => {
    setPlateNumber(plateInput.trim())
    setPage(1)
  }

  const resetFilters = () => {
    setPlateInput('')
    setPlateNumber('')
    setStatus('')
    setBuildingId('')
    setFromDate('')
    setToDate('')
    setPage(1)
  }

  const columns = [
    {
      key: 'plateNumber',
      header: 'Biển số',
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <LogIn className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900">{r.plateNumber}</p>
            {r.isMonthly && (
              <span className="text-xs font-medium text-violet-600">Vé tháng</span>
            )}
            {isOvertime(r) && (
              <span className="flex items-center gap-1 text-xs font-medium text-red-600">
                <AlertTriangle className="h-3 w-3" />
                Quá hạn gửi
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'checkInTime',
      header: 'Giờ vào',
      render: (r) => (
        <span className="inline-flex items-center gap-1.5 text-slate-600">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          {formatDateTime(r.checkInTime)}
        </span>
      ),
    },
    {
      key: 'checkOutTime',
      header: 'Giờ ra',
      render: (r) =>
        r.checkOutTime ? (
          <span className="text-slate-600">{formatDateTime(r.checkOutTime)}</span>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: 'totalFee',
      header: 'Phí',
      align: 'right',
      render: (r) =>
        r.totalFee ? (
          <span className="font-semibold">{formatCurrency(r.totalFee)}</span>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (r) => (
        <Badge color={SESSION_STATUS[r.status]?.color}>
          {SESSION_STATUS[r.status]?.label || r.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) => {
        const isActive = r.status === 1 // Active
        return (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => setDetailId(r.id)}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              title="Chi tiết"
            >
              <Eye className="h-4 w-4" />
            </button>
            {isActive && (
              <>
                <button
                  onClick={() => setUpdateInfoTarget(r)}
                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                  title="Sửa thông tin xe"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setExceptionTarget(r)}
                  className="rounded-lg p-2 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
                  title="Đánh dấu ngoại lệ"
                >
                  <AlertTriangle className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setChangeSlotTarget(r)}
                  className="rounded-lg p-2 text-amber-500 transition-colors hover:bg-amber-50"
                  title="Đổi chỗ"
                >
                  <Replace className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCheckOutTarget(r)}
                  className="rounded-lg p-2 text-emerald-500 transition-colors hover:bg-emerald-50"
                  title="Cho xe ra"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div>
      <PageHeader
        title="Phiên gửi xe"
        description="Quản lý xe vào/ra bãi, tính phí và đổi vị trí đỗ."
        icon={LogIn}
        actions={
          <Button onClick={() => setCheckInOpen(true)}>
            <LogIn className="h-4 w-4" />
            Cho xe vào
          </Button>
        }
      />

      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <Input
              label="Biển số xe"
              placeholder="Tìm theo biển số..."
              value={plateInput}
              onChange={(e) => setPlateInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applySearch()}
              containerClassName="flex-1"
            />
            <Select
              label="Tòa nhà"
              value={buildingId}
              onChange={(e) => {
                setBuildingId(e.target.value)
                setPage(1)
              }}
              placeholder="Tất cả"
              options={buildingOptions}
              containerClassName="w-full lg:w-40"
            />
            <Select
              label="Trạng thái"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                setPage(1)
              }}
              placeholder="Tất cả"
              options={SESSION_STATUS_OPTIONS}
              containerClassName="w-full lg:w-36"
            />
            <Input
              type="date"
              label="Từ ngày"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value)
                setPage(1)
              }}
              containerClassName="w-full lg:w-auto"
            />
            <Input
              type="date"
              label="Đến ngày"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value)
                setPage(1)
              }}
              containerClassName="w-full lg:w-auto"
            />
            <div className="flex gap-2">
              <Button onClick={applySearch}>
                <Search className="h-4 w-4" />
                Tìm
              </Button>
              <Button variant="secondary" onClick={resetFilters}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Table
          columns={columns}
          data={data?.items}
          loading={isLoading}
          emptyTitle="Chưa có phiên gửi xe"
          emptyDescription="Cho xe đầu tiên vào bãi hoặc thay đổi bộ lọc."
          emptyIcon={LogIn}
        />
        {data && (
          <Pagination
            page={data.page}
            pageSize={data.pageSize}
            totalCount={data.totalCount}
            totalPages={data.totalPages}
            onPageChange={setPage}
          />
        )}
      </motion.div>

      <CheckInModal open={checkInOpen} onClose={() => setCheckInOpen(false)} onSaved={invalidate} />

      <CheckOutModal
        open={!!checkOutTarget}
        session={checkOutTarget}
        defaultLostTicket={checkOutLostTicket}
        onClose={() => {
          setCheckOutTarget(null)
          setCheckOutLostTicket(false)
        }}
        onSaved={invalidate}
      />

      <ChangeSlotModal
        open={!!changeSlotTarget}
        session={changeSlotTarget}
        onClose={() => setChangeSlotTarget(null)}
        onSaved={invalidate}
      />

      <UpdateInfoModal
        open={!!updateInfoTarget}
        session={updateInfoTarget}
        onClose={() => setUpdateInfoTarget(null)}
        onSaved={invalidate}
      />

      <MarkExceptionModal
        open={!!exceptionTarget}
        session={exceptionTarget}
        onClose={() => setExceptionTarget(null)}
        onSaved={invalidate}
      />

      <SessionDetailModal
        sessionId={detailId}
        open={!!detailId}
        onClose={() => setDetailId(null)}
      />
    </div>
  )
}
