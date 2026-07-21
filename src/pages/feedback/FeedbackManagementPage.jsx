import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { MessageSquare, Wrench } from 'lucide-react'
import { feedbackService } from '../../services/feedbackService'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card, CardBody } from '../../components/ui/Card'
import { Table } from '../../components/ui/Table'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { FEEDBACK_STATUS, FEEDBACK_TYPE, FEEDBACK_TYPE_OPTIONS } from '../../lib/enums'
import { formatDateTime } from '../../lib/format'
import ResolveFeedbackModal from './ResolveFeedbackModal'

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 1, label: 'Mới' },
  { value: 2, label: 'Đã xem' },
  { value: 3, label: 'Đã xử lý' },
  { value: 4, label: 'Đã đóng' },
]

export default function FeedbackManagementPage() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [selected, setSelected] = useState(null)

  const listQuery = useQuery({
    queryKey: ['feedback', 'all', statusFilter, typeFilter],
    queryFn: () => feedbackService.list({ status: statusFilter || undefined, type: typeFilter || undefined, pageSize: 100 }),
  })

  const columns = [
    {
      key: 'type',
      header: 'Loại',
      render: (r) => (
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
          {FEEDBACK_TYPE[r.type] || 'Khác'}
        </span>
      ),
    },
    { key: 'content', header: 'Nội dung', render: (r) => <span className="line-clamp-2 text-slate-700">{r.content}</span> },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (r) => <Badge color={FEEDBACK_STATUS[r.status]?.color}>{FEEDBACK_STATUS[r.status]?.label || r.status}</Badge>,
    },
    { key: 'createdAt', header: 'Ngày gửi', render: (r) => formatDateTime(r.createdAt) },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end">
          <Button variant="secondary" className="h-8 px-2.5 text-xs" onClick={() => setSelected(r)}>
            <Wrench className="h-3.5 w-3.5" />
            Xử lý
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý phản hồi"
        description="Xem và trả lời phản hồi của khách hàng."
        icon={MessageSquare}
      />

      <Card>
        <CardBody>
          <div className="mb-4 flex flex-wrap gap-3">
            <Select
              label="Lọc theo trạng thái"
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              containerClassName="max-w-xs"
            />
            <Select
              label="Lọc theo loại"
              options={[{ value: '', label: 'Tất cả' }, ...FEEDBACK_TYPE_OPTIONS]}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              containerClassName="max-w-xs"
            />
          </div>
          <Table
            columns={columns}
            data={listQuery.data?.items || []}
            loading={listQuery.isLoading}
            emptyTitle="Chưa có phản hồi"
          />
        </CardBody>
      </Card>

      <ResolveFeedbackModal
        feedback={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        onResolved={() => qc.invalidateQueries({ queryKey: ['feedback', 'all'] })}
      />
    </div>
  )
}
