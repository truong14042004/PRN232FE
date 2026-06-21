import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  CreditCard,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Link2,
  Eye,
  RotateCcw,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { paymentService } from '../../services/paymentService'
import { getErrorMessage } from '../../lib/apiClient'
import {
  PAYMENT_STATUS,
  PAYMENT_METHOD,
  PAYMENT_STATUS_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
} from '../../lib/enums'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card, CardBody } from '../../components/ui/Card'
import { Table } from '../../components/ui/Table'
import { Pagination } from '../../components/ui/Pagination'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import { useAuth } from '../../context/AuthContext'
import { formatCurrency, formatDateTime } from '../../lib/format'
import CreatePaymentModal from './CreatePaymentModal'
import PaymentDetailModal from './PaymentDetailModal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'

export default function PaymentsPage() {
  const queryClient = useQueryClient()
  const { hasRole } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [page, setPage] = useState(1)
  const [plateNumber, setPlateNumber] = useState('')
  const [plateInput, setPlateInput] = useState('')
  const [status, setStatus] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [detailId, setDetailId] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null) // { type, payment }

  // Lọc sẵn theo biển số khi tới từ trang phản hồi "sai phí" (?plate=...).
  useEffect(() => {
    const plate = searchParams.get('plate')
    if (!plate) return
    setPlateInput(plate)
    setPlateNumber(plate)
    setPage(1)
    searchParams.delete('plate')
    setSearchParams(searchParams, { replace: true })
  }, [searchParams, setSearchParams])

  const filters = {
    plateNumber: plateNumber || undefined,
    status: status === '' ? undefined : Number(status),
    page,
    pageSize: 20,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['payments', filters],
    queryFn: () => paymentService.list(filters),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['payments'] })

  const confirmMutation = useMutation({
    mutationFn: (id) => paymentService.confirm(id),
    onSuccess: () => {
      toast.success('Đã xác nhận thanh toán')
      invalidate()
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Xác nhận thất bại')),
  })

  const cancelMutation = useMutation({
    mutationFn: (id) => paymentService.cancel(id),
    onSuccess: () => {
      toast.success('Đã hủy thanh toán')
      invalidate()
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Hủy thất bại')),
  })

  const payosMutation = useMutation({
    mutationFn: (id) => paymentService.payosLink(id),
    onSuccess: (link) => {
      if (link?.checkoutUrl) {
        window.open(link.checkoutUrl, '_blank', 'noopener')
        toast.success('Đã tạo link thanh toán PayOS')
      }
      invalidate()
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Tạo link PayOS thất bại')),
  })

  const applySearch = () => {
    setPlateNumber(plateInput.trim())
    setPage(1)
  }

  const resetFilters = () => {
    setPlateInput('')
    setPlateNumber('')
    setStatus('')
    setPage(1)
  }

  const handleConfirm = () => {
    if (!confirmAction) return
    if (confirmAction.type === 'confirm') confirmMutation.mutate(confirmAction.payment.id)
    if (confirmAction.type === 'cancel') cancelMutation.mutate(confirmAction.payment.id)
    setConfirmAction(null)
  }

  const columns = [
    {
      key: 'plateNumber',
      header: 'Biển số',
      render: (r) => (
        <span className="font-semibold text-slate-900">{r.plateNumber || '—'}</span>
      ),
    },
    {
      key: 'amount',
      header: 'Số tiền',
      align: 'right',
      render: (r) => <span className="font-semibold">{formatCurrency(r.amount)}</span>,
    },
    {
      key: 'method',
      header: 'Phương thức',
      render: (r) => (
        <Badge color={PAYMENT_METHOD[r.method]?.color}>
          {PAYMENT_METHOD[r.method]?.label || r.method}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (r) => (
        <Badge color={PAYMENT_STATUS[r.status]?.color}>
          {PAYMENT_STATUS[r.status]?.label || r.status}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Thời gian tạo',
      render: (r) => <span className="text-slate-500">{formatDateTime(r.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) => {
        const isPending = r.status === 1
        return (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => setDetailId(r.id)}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              title="Chi tiết"
            >
              <Eye className="h-4 w-4" />
            </button>
            {isPending && (
              <>
                <button
                  onClick={() => setConfirmAction({ type: 'confirm', payment: r })}
                  className="rounded-lg p-2 text-emerald-500 transition-colors hover:bg-emerald-50"
                  title="Xác nhận"
                >
                  <CheckCircle2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => payosMutation.mutate(r.id)}
                  className="rounded-lg p-2 text-violet-500 transition-colors hover:bg-violet-50"
                  title="Tạo link PayOS"
                >
                  <Link2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setConfirmAction({ type: 'cancel', payment: r })}
                  className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50"
                  title="Hủy"
                >
                  <XCircle className="h-4 w-4" />
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
        title="Thanh toán"
        description="Quản lý các giao dịch thanh toán phí gửi xe."
        icon={CreditCard}
        actions={
          hasRole('Admin', 'FacilityManager', 'ParkingStaff') && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Tạo thanh toán
            </Button>
          )
        }
      />

      {/* Bộ lọc */}
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
              label="Trạng thái"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                setPage(1)
              }}
              placeholder="Tất cả trạng thái"
              options={PAYMENT_STATUS_OPTIONS}
              containerClassName="w-full sm:w-52"
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
          emptyTitle="Chưa có giao dịch"
          emptyDescription="Tạo giao dịch thanh toán đầu tiên hoặc thay đổi bộ lọc."
          emptyIcon={CreditCard}
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

      <CreatePaymentModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={invalidate}
        methodOptions={PAYMENT_METHOD_OPTIONS}
      />

      <PaymentDetailModal
        paymentId={detailId}
        open={!!detailId}
        onClose={() => setDetailId(null)}
      />

      <ConfirmDialog
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirm}
        title={confirmAction?.type === 'confirm' ? 'Xác nhận thanh toán' : 'Hủy thanh toán'}
        description={
          confirmAction?.type === 'confirm'
            ? `Xác nhận đã thu tiền cho giao dịch biển số ${confirmAction?.payment?.plateNumber}?`
            : `Bạn chắc chắn muốn hủy giao dịch biển số ${confirmAction?.payment?.plateNumber}?`
        }
        confirmText={confirmAction?.type === 'confirm' ? 'Xác nhận' : 'Hủy giao dịch'}
        variant={confirmAction?.type === 'confirm' ? 'primary' : 'danger'}
        loading={confirmMutation.isPending || cancelMutation.isPending}
      />
    </div>
  )
}
