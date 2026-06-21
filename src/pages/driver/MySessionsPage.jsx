import { useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Ticket, CreditCard, ExternalLink } from 'lucide-react'
import { parkingSessionService } from '../../services/parkingSessionService'
import { paymentService } from '../../services/paymentService'
import { getErrorMessage } from '../../lib/apiClient'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card, CardBody } from '../../components/ui/Card'
import { Table } from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { SESSION_STATUS } from '../../lib/enums'
import { formatCurrency, formatDateTime } from '../../lib/format'

export default function MySessionsPage() {
  const sessionsQuery = useQuery({
    queryKey: ['my-sessions'],
    queryFn: () => parkingSessionService.my({ pageSize: 100 }),
  })

  // Lấy payment cho phiên đã hoàn tất → tạo link PayOS → mở trang thanh toán.
  const payMutation = useMutation({
    mutationFn: async (session) => {
      const payments = await paymentService.bySession(session.id)
      const pending = (payments || []).find((p) => p.status === 1 || p.status === 2)
      let paymentId = pending?.id
      // Chưa có payment → tạo mới theo phí của phiên.
      if (!paymentId) {
        const created = await paymentService.create({
          parkingSessionId: session.id,
          plateNumber: session.plateNumber,
          amount: session.totalFee || 0,
          method: 2, // chuyển khoản / PayOS
        })
        paymentId = created.id
      }
      const link = await paymentService.payosLink(paymentId)
      return link
    },
    onSuccess: (link) => {
      if (link?.checkoutUrl) {
        window.open(link.checkoutUrl, '_blank')
        toast.success('Đã mở trang thanh toán PayOS')
      } else {
        toast.error('Không lấy được link thanh toán')
      }
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Tạo thanh toán thất bại')),
  })

  const columns = [
    { key: 'plateNumber', header: 'Biển số', render: (r) => <span className="font-semibold text-slate-800">{r.plateNumber}</span> },
    { key: 'checkInTime', header: 'Giờ vào', render: (r) => formatDateTime(r.checkInTime) },
    { key: 'checkOutTime', header: 'Giờ ra', render: (r) => (r.checkOutTime ? formatDateTime(r.checkOutTime) : '—') },
    { key: 'totalFee', header: 'Phí', render: (r) => (r.totalFee ? formatCurrency(r.totalFee) : '—') },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (r) => <Badge color={SESSION_STATUS[r.status]?.color}>{SESSION_STATUS[r.status]?.label || r.status}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) =>
        // Phiên hoàn tất + có phí → cho thanh toán.
        r.status === 2 && r.totalFee > 0 ? (
          <Button
            variant="secondary"
            className="h-8 px-2.5 text-xs"
            loading={payMutation.isPending}
            onClick={() => payMutation.mutate(r)}
          >
            <CreditCard className="h-3.5 w-3.5" />
            Thanh toán
            <ExternalLink className="h-3 w-3" />
          </Button>
        ) : null,
    },
  ]

  const data = sessionsQuery.data?.items || []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lượt gửi của tôi"
        description="Theo dõi các lượt gửi xe theo biển số đã đăng ký và thanh toán phí."
        icon={Ticket}
      />

      <Card>
        <CardBody>
          {!sessionsQuery.isLoading && data.length === 0 ? (
            <EmptyState
              icon={Ticket}
              title="Chưa có lượt gửi nào"
              description="Đăng ký xe của bạn ở mục 'Xe của tôi' để hệ thống liên kết các lượt gửi."
            />
          ) : (
            <Table columns={columns} data={data} loading={sessionsQuery.isLoading} />
          )}
        </CardBody>
      </Card>
    </div>
  )
}
