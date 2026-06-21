import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Ticket, CreditCard } from 'lucide-react'
import { parkingSessionService } from '../../services/parkingSessionService'
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

  const columns = [
    { key: 'plateNumber', header: 'Biển số', render: (r) => <span className="font-semibold text-slate-800">{r.plateNumber}</span> },
    { key: 'checkInTime', header: 'Giờ vào', render: (r) => formatDateTime(r.checkInTime) },
    { key: 'checkOutTime', header: 'Giờ ra', render: (r) => (r.checkOutTime ? formatDateTime(r.checkOutTime) : '—') },
    {
      key: 'totalFee',
      header: 'Phí',
      render: (r) =>
        r.totalFee ? (
          formatCurrency(r.totalFee)
        ) : r.status === 1 && !r.isMonthly ? (
          <EstimatedFeeCell session={r} />
        ) : r.isMonthly ? (
          <span className="text-violet-600">Vé tháng</span>
        ) : (
          '—'
        ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (r) => <Badge color={SESSION_STATUS[r.status]?.color}>{SESSION_STATUS[r.status]?.label || r.status}</Badge>,
    },
  ]

  const data = sessionsQuery.data?.items || []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lượt gửi của tôi"
        description="Theo dõi các lượt gửi xe theo biển số đã đăng ký."
        icon={Ticket}
        actions={
          <Link to="/my-payments">
            <Button variant="secondary">
              <CreditCard className="h-4 w-4" />
              Thanh toán phí
            </Button>
          </Link>
        }
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

// Phí tạm tính cho phiên đang gửi (Active): dùng endpoint chuyên dụng của BE
// (tính phí tới hiện tại + kiểm tra quyền sở hữu phiên cho Driver).
function EstimatedFeeCell({ session }) {
  const { data, isLoading } = useQuery({
    queryKey: ['estimated-fee', session.id],
    queryFn: () => parkingSessionService.estimateFee(session.id),
    staleTime: 60 * 1000,
  })

  if (isLoading) return <span className="text-slate-400">Đang tính...</span>
  if (data?.estimatedFee == null) return <span className="text-slate-400">—</span>
  return (
    <span className="text-amber-600" title="Phí tạm tính tới hiện tại">
      ~{formatCurrency(data.estimatedFee)}
    </span>
  )
}
