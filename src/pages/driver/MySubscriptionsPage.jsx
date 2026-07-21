import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { CalendarClock, Plus, QrCode, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'
import { subscriptionService } from '../../services/subscriptionService'
import { buildingService } from '../../services/buildingService'
import { vehicleService } from '../../services/vehicleService'
import { paymentService } from '../../services/paymentService'
import { getErrorMessage } from '../../lib/apiClient'
import { SUBSCRIPTION_STATUS, SUBSCRIPTION_STATUS_OPTIONS } from '../../lib/enums'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card, CardBody } from '../../components/ui/Card'
import { Table } from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import { formatCurrency, formatDate } from '../../lib/format'

export default function MySubscriptionsPage() {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [payTarget, setPayTarget] = useState(null)

  const filters = {
    status: status === '' ? undefined : Number(status),
    pageSize: 100,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['my-subscriptions', filters],
    queryFn: () => subscriptionService.my(filters),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['my-subscriptions'] })

  const requestMutation = useMutation({
    mutationFn: (payload) => subscriptionService.request(payload),
    onSuccess: () => {
      toast.success('Đã gửi yêu cầu đăng ký vé tháng')
      setShowForm(false)
      invalidate()
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Đăng ký thất bại')),
  })

  const columns = [
    {
      key: 'plateNumber',
      header: 'Biển số',
      render: (r) => <span className="font-semibold text-slate-900">{r.plateNumber}</span>,
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
        if (r.status === 1) {
          return (
            <Button size="sm" variant="secondary" onClick={() => setPayTarget(r)}>
              <QrCode className="h-4 w-4" />
              Thanh toán
            </Button>
          )
        }
        if (r.status === 5) {
          return <span className="text-xs text-amber-600">Đang chờ duyệt</span>
        }
        if (r.rejectionReason) {
          return <span className="text-xs text-red-500">{r.rejectionReason}</span>
        }
        return null
      },
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vé tháng của tôi"
        description="Đăng ký vé tháng đỗ xe dài hạn. Yêu cầu sẽ được quản lý duyệt."
        icon={CalendarClock}
        actions={
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            Đăng ký vé tháng
          </Button>
        }
      />

      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <Select
              label="Trạng thái"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              placeholder="Tất cả trạng thái"
              options={SUBSCRIPTION_STATUS_OPTIONS}
              containerClassName="w-full sm:w-52"
            />
            <Button
              variant="secondary"
              onClick={() => setStatus('')}
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
        <Card>
          <CardBody>
            <Table
              columns={columns}
              data={data?.items}
              loading={isLoading}
              emptyTitle="Chưa có vé tháng"
              emptyDescription="Đăng ký vé tháng để đỗ xe dài hạn với mức phí ưu đãi."
              emptyIcon={CalendarClock}
            />
          </CardBody>
        </Card>
      </motion.div>

      <RequestSubscriptionModal
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={(payload) => requestMutation.mutate(payload)}
        loading={requestMutation.isPending}
      />

      <PaySubscriptionModal
        open={!!payTarget}
        subscription={payTarget}
        onClose={() => setPayTarget(null)}
        onPaid={invalidate}
      />
    </div>
  )
}

function RequestSubscriptionModal({ open, onClose, onSubmit, loading }) {
  const [form, setForm] = useState({
    vehicleId: '',
    buildingId: '',
    note: '',
  })
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  )

  const buildingsQuery = useQuery({
    queryKey: ['buildings-active'],
    queryFn: () => buildingService.list({ isActive: true, pageSize: 100 }),
    enabled: open,
  })
  const vehiclesQuery = useQuery({
    queryKey: ['my-vehicles-active'],
    queryFn: () => vehicleService.list({ isActive: true, pageSize: 100 }),
    enabled: open,
  })

  const buildings = buildingsQuery.data?.items || []
  const vehicles = vehiclesQuery.data?.items || []
  const selectedVehicle = vehicles.find((v) => v.id === form.vehicleId)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.vehicleId) {
      toast.error('Vui lòng chọn xe')
      return
    }
    if (!form.buildingId) {
      toast.error('Vui lòng chọn tòa nhà')
      return
    }
    const isMotorcycle = selectedVehicle.vehicleCategory === 1
    const monthlyFee = isMotorcycle ? 80000 : 100000
    onSubmit({
      plateNumber: selectedVehicle.plateNumber,
      vehicleId: selectedVehicle.id,
      vehicleTypeId: selectedVehicle.vehicleTypeId,
      ownerName: selectedVehicle.ownerName || '',
      ownerPhone: selectedVehicle.ownerPhone || '',
      buildingId: form.buildingId,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      monthlyFee,
      note: form.note.trim() || undefined,
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Đăng ký vé tháng"
      description="Yêu cầu sẽ được quản lý duyệt trước khi hiệu lực"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Hủy</Button>
          <Button onClick={handleSubmit} loading={loading}>Gửi yêu cầu</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Chọn xe"
          value={form.vehicleId}
          onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
          placeholder="Chọn xe của bạn"
          options={vehicles.map((v) => ({
            value: v.id,
            label: `${v.plateNumber}${v.brand ? ` - ${v.brand}` : ''}`,
          }))}
        />
        {vehicles.length === 0 && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Chưa có xe nào. Vui lòng thêm xe ở mục "Xe của tôi" trước.
          </p>
        )}
        {selectedVehicle && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
            <span className="text-sm text-emerald-700">Phí vé tháng:</span>
            <span className="text-base font-bold text-emerald-600">
              {(selectedVehicle.vehicleCategory === 1 ? 80000 : 100000).toLocaleString('vi-VN')}đ
            </span>
            <span className="text-xs text-slate-500">
              ({selectedVehicle.vehicleCategory === 1 ? 'xe máy' : 'ô tô'})
            </span>
          </div>
        )}
        <Select
          label="Tòa nhà"
          value={form.buildingId}
          onChange={(e) => setForm({ ...form, buildingId: e.target.value })}
          placeholder="Chọn tòa nhà"
          options={buildings.map((b) => ({ value: b.id, label: b.name }))}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Ngày bắt đầu"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            label="Ngày kết thúc"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <Input
          label="Ghi chú (tùy chọn)"
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
        />
      </form>
    </Modal>
  )
}

function PaySubscriptionModal({ open, subscription, onClose, onPaid }) {
  const [loading, setLoading] = useState(false)
  const [link, setLink] = useState(null)

  const handlePay = async () => {
    if (!subscription) return
    setLoading(true)
    try {
      const existing = await paymentService.bySubscription(subscription.id)
      let payment = null
      for (const p of existing) {
        if (p.status === 1 || p.status === 2) {
          payment = p
          break
        }
      }
      if (!payment) {
        payment = await paymentService.create({
          subscriptionId: subscription.id,
          plateNumber: subscription.plateNumber,
          amount: subscription.monthlyFee,
          method: 2,
        })
      }
      if (payment.status === 2) {
        toast.success('Vé tháng đã được thanh toán')
        onPaid()
        onClose()
        return
      }
      const payosLink = await paymentService.payosLink(payment.id)
      setLink(payosLink)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không tạo được thanh toán'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Thanh toán phí vé tháng"
      description={subscription ? `Biển số: ${subscription.plateNumber}` : ''}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Đóng</Button>
          {!link && (
            <Button onClick={handlePay} loading={loading}>
              <QrCode className="h-4 w-4" />
              Tạo mã QR
            </Button>
          )}
        </>
      }
    >
      {link ? (
        <div className="space-y-4 text-center">
          <p className="text-lg font-semibold text-emerald-600">
            {formatCurrency(link.amount)}
          </p>
          {link.qrCode && (
            <img
              src={`data:image/png;base64,${link.qrCode}`}
              alt="QR Code"
              className="mx-auto rounded-lg border border-slate-200"
              style={{ width: 240, height: 240 }}
            />
          )}
          <p className="text-sm text-slate-500">
            Quét mã QR bằng app ngân hàng để thanh toán
          </p>
          {link.checkoutUrl && (
            <a
              href={link.checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm text-brand-600 hover:underline"
            >
              Mở trang PayOS
            </a>
          )}
          <Button
            variant="secondary"
            onClick={() => {
              onPaid()
              onClose()
            }}
          >
            Tôi đã thanh toán
          </Button>
        </div>
      ) : (
        <div className="space-y-3 text-center">
          <p className="text-slate-600">
            Phí vé tháng: <span className="font-semibold">{formatCurrency(subscription?.monthlyFee)}</span>
          </p>
          <p className="text-sm text-slate-400">
            Bấm "Tạo mã QR" để tạo mã thanh toán PayOS
          </p>
        </div>
      )}
    </Modal>
  )
}
