import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { MessageSquare, Send } from 'lucide-react'
import { feedbackService } from '../../services/feedbackService'
import { parkingSessionService } from '../../services/parkingSessionService'
import { useBuildingOptions } from '../../hooks/useOptions'
import { getErrorMessage } from '../../lib/apiClient'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card'
import Select from '../../components/ui/Select'
import Textarea from '../../components/ui/Textarea'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { cn } from '../../lib/cn'
import { FEEDBACK_STATUS, FEEDBACK_TYPE, FEEDBACK_TYPE_OPTIONS } from '../../lib/enums'
import { formatDateTime } from '../../lib/format'

export default function FeedbackPage() {
  const qc = useQueryClient()
  const [type, setType] = useState(5)
  const [content, setContent] = useState('')
  const [buildingId, setBuildingId] = useState('')
  const [sessionId, setSessionId] = useState('')

  const { options: buildingOptions } = useBuildingOptions()

  const myQuery = useQuery({
    queryKey: ['feedback', 'my'],
    queryFn: () => feedbackService.my({ pageSize: 50 }),
  })

  // Lượt gửi xe của tôi → cho phép gắn phản hồi vào đúng phiên (giúp nhân viên truy vết & xử lý).
  const sessionsQuery = useQuery({
    queryKey: ['my-sessions', 'feedback-picker'],
    queryFn: () => parkingSessionService.my({ pageSize: 100 }),
  })
  const sessionOptions = (sessionsQuery.data?.items || []).map((s) => ({
    value: s.id,
    label: `${s.plateNumber} · ${formatDateTime(s.checkInTime)}`,
  }))
  const selectedSession = (sessionsQuery.data?.items || []).find((s) => s.id === sessionId)

  const createMutation = useMutation({
    mutationFn: () =>
      feedbackService.create({
        type: Number(type),
        content: content.trim(),
        buildingId: buildingId || selectedSession?.buildingId || undefined,
        parkingSessionId: sessionId || undefined,
        plateNumber: selectedSession?.plateNumber || undefined,
      }),
    onSuccess: () => {
      toast.success('Đã gửi phản hồi')
      setContent('')
      setType(5)
      setSessionId('')
      qc.invalidateQueries({ queryKey: ['feedback', 'my'] })
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Gửi phản hồi thất bại')),
  })

  const items = myQuery.data?.items || []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Phản hồi"
        description="Gửi phản hồi về mất thẻ, sai phí, khó tìm xe hoặc vấn đề trong bãi."
        icon={MessageSquare}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Form gửi phản hồi */}
        <Card>
          <CardHeader>
            <CardTitle>Gửi phản hồi mới</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <Select
                label="Loại phản hồi"
                options={FEEDBACK_TYPE_OPTIONS}
                value={type}
                onChange={(e) => setType(e.target.value)}
              />

              <Select
                label="Lượt gửi xe liên quan (tùy chọn)"
                placeholder={sessionOptions.length ? 'Chọn lượt gửi xe' : 'Chưa có lượt gửi xe'}
                options={sessionOptions}
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                hint="Gắn vào lượt gửi xe giúp nhân viên tra cứu và xử lý nhanh hơn."
              />

              <Select
                label="Bãi xe (tùy chọn)"
                placeholder="Chọn bãi liên quan"
                options={buildingOptions}
                value={buildingId}
                onChange={(e) => setBuildingId(e.target.value)}
              />

              <Textarea
                label="Nội dung"
                placeholder="Mô tả vấn đề hoặc góp ý của bạn..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
              />

              <Button
                onClick={() => createMutation.mutate()}
                loading={createMutation.isPending}
                disabled={!content.trim()}
              >
                <Send className="h-4 w-4" />
                Gửi phản hồi
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Phản hồi đã gửi */}
        <Card>
          <CardHeader>
            <CardTitle>Phản hồi của tôi</CardTitle>
          </CardHeader>
          <CardBody>
            {!myQuery.isLoading && items.length === 0 ? (
              <EmptyState icon={MessageSquare} title="Chưa có phản hồi" description="Phản hồi bạn gửi sẽ hiển thị tại đây." />
            ) : (
              <ul className="space-y-3">
                {items.map((f) => (
                  <li key={f.id} className="rounded-xl border border-slate-200 p-3">
                    <div className="flex items-center justify-between">
                      <Badge color={FEEDBACK_STATUS[f.status]?.color}>
                        {FEEDBACK_STATUS[f.status]?.label || f.status}
                      </Badge>
                    </div>
                    <p className="mt-1.5 text-sm text-slate-700">{f.content}</p>
                    <p className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
                        {FEEDBACK_TYPE[f.type] || 'Khác'}
                      </span>
                      {formatDateTime(f.createdAt)}
                    </p>
                    {f.response && (
                      <div className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                        <span className="font-medium">Phản hồi từ quản lý: </span>
                        {f.response}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
