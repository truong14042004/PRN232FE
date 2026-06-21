import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  CalendarCheck,
  Plus,
  Search,
  Pencil,
  CheckCircle2,
  XCircle,
  LogIn,
  Clock,
  RotateCcw,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { reservationService } from '../../services/reservationService'
import { getErrorMessage } from '../../lib/apiClient'
import { RESERVATION_STATUS, RESERVATION_STATUS_OPTIONS } from '../../lib/enums'
import { useBuildingOptions } from '../../hooks/useOptions'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card, CardBody } from '../../components/ui/Card'
import { Table } from '../../components/ui/Table'
import { Pagination } from '../../components/ui/Pagination'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { useAuth } from '../../context/AuthContext'
import { formatDateTime } from '../../lib/format'
import ReservationFormModal from './ReservationFormModal'

export default function ReservationsPage() {
  const queryClient = useQueryClient()
  const { hasRole, user } = useAuth()
  const canManage = hasRole('Admin', 'FacilityManager', 'ParkingStaff')
  const isDriver = hasRole('Driver')
  // Driver tự đặt chỗ được (BE cho phép), nhưng không quản lý xác nhận/hủy của người khác.
  const canCreate = canManage || hasRole('Driver')
  const { options: buildingOptions } = useBuildingOptions()

  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [buildingId, setBuildingId] = useState('')
  const [plateNumber, setPlateNumber] = useState('')
  const [plateInput, setPlateInput] = useState('')
  const [formState, setFormState] = useState(null) // null | { mode, reservation }
  const [confirmAction, setConfirmAction] = useState(null) // { type, reservation }

  const filters = {
    status: status === '' ? undefined : Number(status),
    buildingId: buildingId || undefined,
    plateNumber: plateNumber || undefined,
    page,
    pageSize: 20,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['reservations', filters],
    queryFn: () => reservationService.list(filters),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['reservations'] })

  const confirmMutation = useMutation({
    mutationFn: (id) => reservationService.confirm(id),
    onSuccess: () => {
      toast.success('Đã xác nhận đặt chỗ')
      invalidate()
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Xác nhận thất bại')),
  })

  const cancelMutation = useMutation({
    mutationFn: (id) => reservationService.cancel(id),
    onSuccess: () => {
      toast.success('Đã hủy đặt chỗ')
      invalidate()
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Hủy thất bại')),
  })

  const expireMutation = useMutation({
    mutationFn: (id) => reservationService.expire(id),
    onSuccess: () => {
      toast.success('Đã đánh dấu hết hạn')
      invalidate()
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Thao tác thất bại')),
  })

  const applySearch = () => {
    setPlateNumber(plateInput.trim())
    setPage(1)
  }

  const resetFilters = () => {
    setPlateInput('')
    setPlateNumber('')
    setStatus('')
    setBuildingId('')
    setPage(1)
  }

  const handleConfirm = () => {
    if (!confirmAction) return
    const id = confirmAction.reservation.id
    if (confirmAction.type === 'confirm') confirmMutation.mutate(id)
    if (confirmAction.type === 'cancel') cancelMutation.mutate(id)
    if (confirmAction.type === 'expire') expireMutation.mutate(id)
    setConfirmAction(null)
  }

  const columns = [
    {
      key: 'plateNumber',
      header: 'Biển số',
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <CalendarCheck className="h-5 w-5" />
          </div>
          <span className="font-semibold text-slate-900">{r.plateNumber}</span>
        </div>
      ),
    },
    {
      key: 'period',
      header: 'Khung giờ giữ chỗ',
      render: (r) => (
        <div className="text-slate-600">
          <p className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            {formatDateTime(r.reservedFrom)}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">đến {formatDateTime(r.reservedTo)}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (r) => (
        <Badge color={RESERVATION_STATUS[r.status]?.color}>
          {RESERVATION_STATUS[r.status]?.label || r.status}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Tạo lúc',
      render: (r) => <span className="text-slate-500">{formatDateTime(r.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) => {
        const isPending = r.status === 1 // Pending
        const isConfirmed = r.status === 2 // Confirmed
        const canEdit = isPending || isConfirmed

        // Driver chỉ được tự hủy đặt chỗ của chính mình (Pending/Confirmed).
        // BE đã enforce ownership (trả 403 nếu hủy của người khác), nhưng vẫn
        // lọc theo user.id nếu xác định được để chỉ hiện nút Hủy đúng của mình.
        if (!canManage) {
          if (!isDriver || !canEdit) return null
          const isOwn = !user?.id || !r.driverUserId || r.driverUserId === user.id
          if (!isOwn) return null
          return (
            <div className="flex items-center justify-end gap-1">
              <button
                onClick={() => setConfirmAction({ type: 'cancel', reservation: r })}
                className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50"
                title="Hủy"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          )
        }

        return (
          <div className="flex items-center justify-end gap-1">
            {canEdit && (
              <button
                onClick={() => setFormState({ mode: 'edit', reservation: r })}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                title="Sửa"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
            {isPending && (
              <button
                onClick={() => setConfirmAction({ type: 'confirm', reservation: r })}
                className="rounded-lg p-2 text-emerald-500 transition-colors hover:bg-emerald-50"
                title="Xác nhận"
              >
                <CheckCircle2 className="h-4 w-4" />
              </button>
            )}
            {isConfirmed && (
              <button
                onClick={() => setConfirmAction({ type: 'expire', reservation: r })}
                className="rounded-lg p-2 text-amber-500 transition-colors hover:bg-amber-50"
                title="Đánh dấu hết hạn"
              >
                <Clock className="h-4 w-4" />
              </button>
            )}
            {canEdit && (
              <button
                onClick={() => setConfirmAction({ type: 'cancel', reservation: r })}
                className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50"
                title="Hủy"
              >
                <XCircle className="h-4 w-4" />
              </button>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div>
      <PageHeader
        title="Đặt chỗ"
        description="Quản lý yêu cầu giữ chỗ trước của khách hàng."
        icon={CalendarCheck}
        actions={
          canCreate && (
            <Button onClick={() => setFormState({ mode: 'create' })}>
              <Plus className="h-4 w-4" />
              Tạo đặt chỗ
            </Button>
          )
        }
      />

      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
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
              placeholder="Tất cả tòa nhà"
              options={buildingOptions}
              containerClassName="w-full sm:w-48"
            />
            <Select
              label="Trạng thái"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                setPage(1)
              }}
              placeholder="Tất cả trạng thái"
              options={RESERVATION_STATUS_OPTIONS}
              containerClassName="w-full sm:w-44"
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
          emptyTitle="Chưa có đặt chỗ"
          emptyDescription="Tạo yêu cầu đặt chỗ đầu tiên hoặc thay đổi bộ lọc."
          emptyIcon={CalendarCheck}
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

      <ReservationFormModal
        open={!!formState}
        mode={formState?.mode}
        reservation={formState?.reservation}
        hideZone={!canManage}
        onClose={() => setFormState(null)}
        onSaved={invalidate}
      />

      <ConfirmDialog
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirm}
        title={
          confirmAction?.type === 'confirm'
            ? 'Xác nhận đặt chỗ'
            : confirmAction?.type === 'expire'
              ? 'Đánh dấu hết hạn'
              : 'Hủy đặt chỗ'
        }
        description={
          confirmAction?.type === 'confirm'
            ? `Xác nhận đặt chỗ cho biển số ${confirmAction?.reservation?.plateNumber}?`
            : confirmAction?.type === 'expire'
              ? `Đánh dấu đặt chỗ của biển số ${confirmAction?.reservation?.plateNumber} là hết hạn?`
              : `Bạn chắc chắn muốn hủy đặt chỗ của biển số ${confirmAction?.reservation?.plateNumber}?`
        }
        confirmText={
          confirmAction?.type === 'confirm'
            ? 'Xác nhận'
            : confirmAction?.type === 'expire'
              ? 'Đánh dấu hết hạn'
              : 'Hủy đặt chỗ'
        }
        variant={confirmAction?.type === 'cancel' ? 'danger' : 'primary'}
        loading={
          confirmMutation.isPending || cancelMutation.isPending || expireMutation.isPending
        }
      />
    </div>
  )
}
