import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  CalendarClock,
  Plus,
  Search,
  Pencil,
  RefreshCw,
  PauseCircle,
  XCircle,
  RotateCcw,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { subscriptionService } from '../../services/subscriptionService'
import { getErrorMessage } from '../../lib/apiClient'
import { SUBSCRIPTION_STATUS, SUBSCRIPTION_STATUS_OPTIONS } from '../../lib/enums'
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
import { formatCurrency, formatDate } from '../../lib/format'
import SubscriptionFormModal from './SubscriptionFormModal'
import RenewSubscriptionModal from './RenewSubscriptionModal'

export default function SubscriptionsPage() {
  const queryClient = useQueryClient()
  const { hasRole } = useAuth()
  const canManage = hasRole('Admin', 'FacilityManager')

  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [formState, setFormState] = useState(null) // null | { mode, subscription }
  const [renewTarget, setRenewTarget] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null) // { type, subscription }

  const filters = {
    status: status === '' ? undefined : Number(status),
    page,
    pageSize: 20,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['subscriptions', filters],
    queryFn: () => subscriptionService.list(filters),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['subscriptions'] })

  const suspendMutation = useMutation({
    mutationFn: (id) => subscriptionService.suspend(id),
    onSuccess: () => {
      toast.success('Đã tạm ngưng vé tháng')
      invalidate()
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Tạm ngưng thất bại')),
  })

  const cancelMutation = useMutation({
    mutationFn: (id) => subscriptionService.cancel(id),
    onSuccess: () => {
      toast.success('Đã hủy vé tháng')
      invalidate()
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Hủy thất bại')),
  })

  const handleConfirm = () => {
    if (!confirmAction) return
    if (confirmAction.type === 'suspend') suspendMutation.mutate(confirmAction.subscription.id)
    if (confirmAction.type === 'cancel') cancelMutation.mutate(confirmAction.subscription.id)
    setConfirmAction(null)
  }

  const columns = [
    {
      key: 'plateNumber',
      header: 'Biển số',
      render: (r) => <span className="font-semibold text-slate-900">{r.plateNumber}</span>,
    },
    {
      key: 'ownerName',
      header: 'Chủ xe',
      render: (r) => (
        <div>
          <p className="font-medium text-slate-800">{r.ownerName}</p>
          <p className="text-xs text-slate-400">{r.ownerPhone}</p>
        </div>
      ),
    },
    {
      key: 'period',
      header: 'Hiệu lực',
      render: (r) => (
        <span className="text-slate-600">
          {formatDate(r.startDate)} – {formatDate(r.endDate)}
        </span>
      ),
    },
    {
      key: 'monthlyFee',
      header: 'Phí/tháng',
      align: 'right',
      render: (r) => <span className="font-semibold">{formatCurrency(r.monthlyFee)}</span>,
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (r) => (
        <Badge color={SUBSCRIPTION_STATUS[r.status]?.color}>
          {SUBSCRIPTION_STATUS[r.status]?.label || r.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) => {
        if (!canManage) return null
        const isActive = r.status === 1
        return (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => setFormState({ mode: 'edit', subscription: r })}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              title="Sửa"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => setRenewTarget(r)}
              className="rounded-lg p-2 text-brand-500 transition-colors hover:bg-brand-50"
              title="Gia hạn"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            {isActive && (
              <>
                <button
                  onClick={() => setConfirmAction({ type: 'suspend', subscription: r })}
                  className="rounded-lg p-2 text-amber-500 transition-colors hover:bg-amber-50"
                  title="Tạm ngưng"
                >
                  <PauseCircle className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setConfirmAction({ type: 'cancel', subscription: r })}
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
        title="Vé tháng"
        description="Quản lý vé tháng và gia hạn cho khách hàng thường xuyên."
        icon={CalendarClock}
        actions={
          canManage && (
            <Button onClick={() => setFormState({ mode: 'create' })}>
              <Plus className="h-4 w-4" />
              Tạo vé tháng
            </Button>
          )
        }
      />

      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <Select
              label="Trạng thái"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                setPage(1)
              }}
              placeholder="Tất cả trạng thái"
              options={SUBSCRIPTION_STATUS_OPTIONS}
              containerClassName="w-full sm:w-52"
            />
            <Button
              variant="secondary"
              onClick={() => {
                setStatus('')
                setPage(1)
              }}
            >
              <RotateCcw className="h-4 w-4" />
              Đặt lại
            </Button>
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
          emptyTitle="Chưa có vé tháng"
          emptyDescription="Tạo vé tháng đầu tiên cho khách hàng."
          emptyIcon={CalendarClock}
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

      <SubscriptionFormModal
        open={!!formState}
        mode={formState?.mode}
        subscription={formState?.subscription}
        onClose={() => setFormState(null)}
        onSaved={invalidate}
      />

      <RenewSubscriptionModal
        open={!!renewTarget}
        subscription={renewTarget}
        onClose={() => setRenewTarget(null)}
        onRenewed={invalidate}
      />

      <ConfirmDialog
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirm}
        title={confirmAction?.type === 'suspend' ? 'Tạm ngưng vé tháng' : 'Hủy vé tháng'}
        description={
          confirmAction?.type === 'suspend'
            ? `Tạm ngưng vé tháng của biển số ${confirmAction?.subscription?.plateNumber}? Có thể kích hoạt lại sau.`
            : `Bạn chắc chắn muốn hủy vé tháng của biển số ${confirmAction?.subscription?.plateNumber}? Thao tác này không thể hoàn tác.`
        }
        confirmText={confirmAction?.type === 'suspend' ? 'Tạm ngưng' : 'Hủy vé tháng'}
        variant={confirmAction?.type === 'suspend' ? 'primary' : 'danger'}
        loading={suspendMutation.isPending || cancelMutation.isPending}
      />
    </div>
  )
}
