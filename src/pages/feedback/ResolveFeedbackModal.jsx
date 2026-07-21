import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  Reply,
  LogOut,
  Calculator,
  CreditCard,
  MapPin,
  Replace,
  Clock,
  Car,
} from 'lucide-react'
import { feedbackService } from '../../services/feedbackService'
import { parkingSessionService } from '../../services/parkingSessionService'
import { getErrorMessage } from '../../lib/apiClient'
import Modal from '../../components/ui/Modal'
import Textarea from '../../components/ui/Textarea'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import { cn } from '../../lib/cn'
import { FEEDBACK_STATUS, FEEDBACK_TYPE, SESSION_STATUS } from '../../lib/enums'
import { formatCurrency, formatDateTime } from '../../lib/format'

const RESPOND_STATUS_OPTIONS = [
  { value: 3, label: 'Đã xử lý' },
  { value: 2, label: 'Đã xem' },
  { value: 4, label: 'Đã đóng' },
]

// Kịch bản xử lý cho từng loại phản hồi (FeedbackType).
// needsSession: có cần tra phiên đang gửi theo biển số không.
// actions(ctx) → mảng nút điều hướng tới nghiệp vụ có sẵn.
const EXCEPTION_PLAYBOOK = {
  // 1 - Mất thẻ xe → cho xe ra với phí phạt mất thẻ.
  1: {
    needsSession: true,
    hint: 'Xác minh phiên đang gửi rồi cho xe ra, áp phí phạt mất thẻ theo chính sách.',
    actions: ({ plate, navigate, close }) => [
      {
        key: 'checkout-lost',
        label: 'Cho xe ra (mất thẻ)',
        icon: LogOut,
        variant: 'danger',
        disabled: !plate,
        onClick: () => {
          navigate(`/sessions?plate=${encodeURIComponent(plate)}&action=checkout&lostTicket=1`)
          close()
        },
      },
    ],
  },
  // 2 - Sai phí → soát phí phiên + kiểm tra thanh toán.
  2: {
    needsSession: true,
    hint: 'Soát lại phí của phiên và đối chiếu giao dịch thanh toán liên quan.',
    actions: ({ plate, navigate, close }) => [
      {
        key: 'review-session',
        label: 'Soát phí phiên',
        icon: Calculator,
        variant: 'primary',
        disabled: !plate,
        onClick: () => {
          navigate(`/sessions?plate=${encodeURIComponent(plate)}&action=checkout`)
          close()
        },
      },
      {
        key: 'view-payments',
        label: 'Xem thanh toán',
        icon: CreditCard,
        variant: 'secondary',
        disabled: !plate,
        onClick: () => {
          navigate(`/payments?plate=${encodeURIComponent(plate)}`)
          close()
        },
      },
    ],
  },
  // 3 - Khó tìm xe → chỉ vị trí slot trên sơ đồ bãi.
  3: {
    needsSession: true,
    hint: 'Tra vị trí chỗ đỗ của xe và hướng dẫn khách trên sơ đồ bãi.',
    actions: ({ session, navigate, close }) => [
      {
        key: 'view-map',
        label: 'Xem trên sơ đồ bãi',
        icon: MapPin,
        variant: 'primary',
        disabled: !session?.buildingId,
        onClick: () => {
          const params = new URLSearchParams()
          if (session?.buildingId) params.set('building', session.buildingId)
          if (session?.floorId) params.set('floor', session.floorId)
          navigate(`/parking-map?${params.toString()}`)
          close()
        },
      },
    ],
  },
  // 4 - Slot bị chiếm → đổi chỗ đỗ + xem sơ đồ.
  4: {
    needsSession: true,
    hint: 'Kiểm tra slot bị chiếm, đổi chỗ đỗ cho phiên hoặc cập nhật trạng thái slot.',
    actions: ({ plate, session, navigate, close }) => [
      {
        key: 'change-slot',
        label: 'Đổi chỗ đỗ',
        icon: Replace,
        variant: 'primary',
        disabled: !plate,
        onClick: () => {
          navigate(`/sessions?plate=${encodeURIComponent(plate)}&action=changeslot`)
          close()
        },
      },
      {
        key: 'view-map',
        label: 'Xem sơ đồ bãi',
        icon: MapPin,
        variant: 'secondary',
        disabled: !session?.buildingId,
        onClick: () => {
          const params = new URLSearchParams()
          if (session?.buildingId) params.set('building', session.buildingId)
          if (session?.floorId) params.set('floor', session.floorId)
          navigate(`/parking-map?${params.toString()}`)
          close()
        },
      },
    ],
  },
  // 5 - Khác → không có nghiệp vụ chuyên biệt, chỉ trả lời.
  5: {
    needsSession: false,
    hint: 'Phản hồi chung — trả lời và cập nhật trạng thái.',
    actions: () => [],
  },
}

// Tóm tắt phiên đang gửi (nhận dữ liệu đã tra ở cấp modal).
function SessionSummary({ plate, query }) {
  const { data, isLoading, isError } = query

  if (!plate) {
    return (
      <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
        Phản hồi không gắn biển số xe nên không tra được phiên gửi xe.
      </p>
    )
  }
  if (isLoading) return <Spinner label="Đang tra phiên gửi xe..." />
  if (isError || !data) {
    return (
      <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
        Không tìm thấy phiên đang gửi cho biển số <span className="font-semibold">{plate}</span>.
        Xe có thể đã ra bãi hoặc biển số chưa chính xác.
      </p>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="flex items-center gap-2 font-semibold text-slate-800">
          <Car className="h-4 w-4 text-brand-600" />
          {data.plateNumber}
        </span>
        <Badge color={SESSION_STATUS[data.status]?.color}>
          {SESSION_STATUS[data.status]?.label || data.status}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <Info label="Giờ vào" value={formatDateTime(data.checkInTime)} icon={Clock} />
        <Info label="Phí tạm tính" value={data.totalFee ? formatCurrency(data.totalFee) : '—'} />
        <Info label="Mã chỗ đỗ" value={data.parkingSlotId || '—'} mono />
        <Info label="Mã khu vực" value={data.zoneId || '—'} mono />
      </div>
    </div>
  )
}

function Info({ label, value, icon: Icon, mono }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className={cn('font-medium text-slate-700', mono && 'font-mono text-xs')}>
        {Icon && <Icon className="mr-1 inline h-3.5 w-3.5 text-slate-400" />}
        {value}
      </p>
    </div>
  )
}

// Modal xử lý ngoại lệ: nội dung theo loại phản hồi + trả lời khách.
export default function ResolveFeedbackModal({ feedback, open, onClose, onResolved }) {
  const navigate = useNavigate()
  const [response, setResponse] = useState('')
  const [respondStatus, setRespondStatus] = useState(3)

  useEffect(() => {
    if (open && feedback) {
      setResponse(feedback.response || '')
      setRespondStatus(feedback.status === 1 ? 3 : feedback.status)
    }
  }, [open, feedback])

  const respondMutation = useMutation({
    mutationFn: () =>
      feedbackService.respond(feedback.id, {
        response: response.trim(),
        status: Number(respondStatus),
      }),
    onSuccess: () => {
      toast.success('Đã trả lời phản hồi')
      onResolved?.()
      onClose?.()
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Trả lời thất bại')),
  })

  // Tra phiên đang gửi theo biển số (dùng chung cho panel tóm tắt + nút điều hướng sơ đồ).
  const plate = feedback?.plateNumber || ''
  const needsSession = !!(feedback && (EXCEPTION_PLAYBOOK[feedback.type] || EXCEPTION_PLAYBOOK[5]).needsSession)
  const sessionQuery = useQuery({
    queryKey: ['parking-sessions', 'active-by-plate', plate],
    queryFn: () => parkingSessionService.activeByPlate(plate),
    enabled: open && needsSession && !!plate,
    retry: false,
  })

  if (!feedback) return null

  const playbook = EXCEPTION_PLAYBOOK[feedback.type] || EXCEPTION_PLAYBOOK[5]
  const session = sessionQuery.data
  const actions = playbook.actions({
    plate,
    session, // phiên đang gửi đã tra theo biển số (undefined nếu chưa/không có)
    navigate,
    close: onClose,
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Xử lý phản hồi"
      description={`Loại: ${FEEDBACK_TYPE[feedback.type] || 'Khác'}`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Đóng
          </Button>
          <Button
            onClick={() => respondMutation.mutate()}
            loading={respondMutation.isPending}
            disabled={!response.trim()}
          >
            <Reply className="h-4 w-4" />
            Gửi trả lời
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Header phản hồi */}
        <div className="rounded-xl bg-slate-50/80 p-4">
          <div className="flex items-center justify-between">
            <Badge color={FEEDBACK_STATUS[feedback.status]?.color}>
              {FEEDBACK_STATUS[feedback.status]?.label || feedback.status}
            </Badge>
          </div>
          <p className="mt-2 text-sm text-slate-700">{feedback.content}</p>
          <p className="mt-1 text-xs text-slate-400">{formatDateTime(feedback.createdAt)}</p>
        </div>

        {/* Gợi ý xử lý theo loại */}
        <div className="rounded-lg border-l-4 border-brand-400 bg-brand-50/50 px-3 py-2 text-sm text-brand-800">
          {playbook.hint}
        </div>

        {/* Panel tra phiên (nếu loại cần) */}
        {playbook.needsSession && <SessionSummary plate={plate} query={sessionQuery} />}

        {/* Nút điều hướng tới nghiệp vụ */}
        {actions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {actions.map((a) => {
              const Icon = a.icon
              return (
                <Button
                  key={a.key}
                  variant={a.variant}
                  onClick={a.onClick}
                  disabled={a.disabled}
                  title={a.disabled ? 'Không đủ thông tin để thực hiện' : undefined}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {a.label}
                </Button>
              )
            })}
          </div>
        )}

        {/* Trả lời khách */}
        <div className="space-y-3 border-t border-slate-100 pt-4">
          <Select
            label="Cập nhật trạng thái"
            options={RESPOND_STATUS_OPTIONS}
            value={respondStatus}
            onChange={(e) => setRespondStatus(e.target.value)}
          />
          <Textarea
            label="Nội dung trả lời"
            placeholder="Phản hồi tới khách hàng..."
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            rows={4}
          />
        </div>
      </div>
    </Modal>
  )
}
