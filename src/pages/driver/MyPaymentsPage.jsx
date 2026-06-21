import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { CreditCard, ExternalLink, CheckCircle2, Wallet, Clock } from 'lucide-react'
import { parkingSessionService } from '../../services/parkingSessionService'
import { paymentService } from '../../services/paymentService'
import { getErrorMessage } from '../../lib/apiClient'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { Spinner } from '../../components/ui/Spinner'
import { PAYMENT_STATUS, PAYMENT_METHOD } from '../../lib/enums'
import { formatCurrency, formatDateTime } from '../../lib/format'

// SessionStatus.Completed = 2. Chỉ phiên đã hoàn tất mới phát sinh phí phải trả.
const STATUS_COMPLETED = 2
// PaymentStatus: Pending=1, Paid=2.
const PAY_PENDING = 1
const PAY_PAID = 2

export default function MyPaymentsPage() {
  const sessionsQuery = useQuery({
    queryKey: ['my-sessions', 'payments'],
    queryFn: () => parkingSessionService.my({ pageSize: 100 }),
  })

  const sessions = sessionsQuery.data?.items || []
  // Các phiên đã hoàn tất, có phí phải trả.
  const payable = sessions.filter((s) => s.status === STATUS_COMPLETED && s.totalFee > 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Thanh toán của tôi"
        description="Thanh toán phí gửi xe trực tuyến qua PayOS cho các lượt đã hoàn tất."
        icon={Wallet}
      />

      <Card>
        <CardHeader>
          <CardTitle>Lượt gửi cần thanh toán</CardTitle>
        </CardHeader>
        <CardBody>
          {sessionsQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : payable.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="Không có khoản nào cần thanh toán"
              description="Các lượt gửi đã hoàn tất và có phí sẽ hiển thị ở đây để bạn thanh toán."
            />
          ) : (
            <ul className="space-y-3">
              {payable.map((s) => (
                <PayableRow key={s.id} session={s} />
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

// Một dòng phiên cần thanh toán. Tự tra payment hiện có của phiên để biết
// đã thanh toán chưa, tránh tạo payment trùng và tránh hiện nút khi đã trả.
function PayableRow({ session, onPaid }) {
  const qc = useQueryClient()

  const paymentsQuery = useQuery({
    queryKey: ['payments', 'by-session', session.id],
    queryFn: () => paymentService.bySession(session.id),
  })

  const payments = paymentsQuery.data || []
  const paid = payments.find((p) => p.status === PAY_PAID)
  const pending = payments.find((p) => p.status === PAY_PENDING)

  const payMutation = useMutation({
    mutationFn: async () => {
      // Tái dùng payment Pending nếu có; ngược lại tạo mới theo phí chính thức của phiên.
      let paymentId = pending?.id
      if (!paymentId) {
        const created = await paymentService.create({
          parkingSessionId: session.id,
          plateNumber: session.plateNumber,
          amount: session.totalFee,
          method: 2, // PayOS / chuyển khoản
        })
        paymentId = created.id
      }
      return paymentService.payosLink(paymentId)
    },
    onSuccess: (link) => {
      qc.invalidateQueries({ queryKey: ['payments', 'by-session', session.id] })
      if (link?.checkoutUrl) {
        window.open(link.checkoutUrl, '_blank')
        toast.success('Đã mở trang thanh toán PayOS')
      } else {
        toast.error('Không lấy được link thanh toán')
      }
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Tạo thanh toán thất bại')),
  })

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800">{session.plateNumber}</span>
          <span className="text-lg font-bold text-brand-600">{formatCurrency(session.totalFee)}</span>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-slate-400">
          <Clock className="h-3.5 w-3.5" />
          Vào {formatDateTime(session.checkInTime)}
          {session.checkOutTime && ` · Ra ${formatDateTime(session.checkOutTime)}`}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {paymentsQuery.isLoading ? (
          <Spinner className="h-4 w-4" />
        ) : paid ? (
          <Badge color={PAYMENT_STATUS[PAY_PAID]?.color}>
            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
            Đã thanh toán
            {paid.method ? ` · ${PAYMENT_METHOD[paid.method]?.label || ''}` : ''}
          </Badge>
        ) : (
          <Button
            variant="primary"
            className="h-9 px-3 text-sm"
            loading={payMutation.isPending}
            onClick={() => payMutation.mutate()}
          >
            <CreditCard className="h-4 w-4" />
            {pending ? 'Tiếp tục thanh toán' : 'Thanh toán'}
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </li>
  )
}
