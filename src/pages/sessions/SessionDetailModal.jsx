import { useQuery } from '@tanstack/react-query'
import { parkingSessionService } from '../../services/parkingSessionService'
import { SESSION_STATUS } from '../../lib/enums'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import { formatCurrency, formatDateTime } from '../../lib/format'

// Một dòng nhãn — giá trị trong bảng chi tiết.
function DetailRow({ label, value, mono }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2.5 last:border-0">
      <span className="shrink-0 text-sm text-slate-500">{label}</span>
      <span
        className={`text-right text-sm font-medium text-slate-800 ${mono ? 'font-mono text-xs' : ''}`}
      >
        {value ?? '—'}
      </span>
    </div>
  )
}

export default function SessionDetailModal({ sessionId, open, onClose }) {
  const { data: session, isLoading } = useQuery({
    queryKey: ['parking-sessions', 'detail', sessionId],
    queryFn: () => parkingSessionService.get(sessionId),
    enabled: !!sessionId && open,
  })

  return (
    <Modal open={open} onClose={onClose} title="Chi tiết phiên gửi xe" size="md">
      {isLoading ? (
        <Spinner label="Đang tải chi tiết..." />
      ) : session ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
            <div>
              <p className="text-xs text-slate-400">Biển số</p>
              <p className="text-2xl font-bold text-slate-900">{session.plateNumber}</p>
              {session.isMonthly && (
                <span className="text-xs font-medium text-violet-600">Xe vé tháng</span>
              )}
            </div>
            <Badge color={SESSION_STATUS[session.status]?.color}>
              {SESSION_STATUS[session.status]?.label || session.status}
            </Badge>
          </div>

          <div>
            <DetailRow label="Giờ vào" value={formatDateTime(session.checkInTime)} />
            <DetailRow label="Giờ ra" value={formatDateTime(session.checkOutTime)} />
            <DetailRow label="Cổng vào" value={session.entryGate} />
            <DetailRow label="Cổng ra" value={session.exitGate} />
            <DetailRow
              label="Tổng phí"
              value={session.totalFee ? formatCurrency(session.totalFee) : '—'}
            />
            <DetailRow label="Mã chỗ đỗ" value={session.parkingSlotId} mono />
            <DetailRow label="Mã khu vực" value={session.zoneId} mono />
            <DetailRow label="Mã tòa nhà" value={session.buildingId} mono />
            <DetailRow label="Mã thanh toán" value={session.paymentId} mono />
            {session.subscriptionId && (
              <DetailRow label="Mã vé tháng" value={session.subscriptionId} mono />
            )}
            {session.checkInNote && <DetailRow label="Ghi chú vào" value={session.checkInNote} />}
            {session.checkOutNote && <DetailRow label="Ghi chú ra" value={session.checkOutNote} />}
            <DetailRow label="Người tạo" value={session.createdByUserId} mono />
            {session.completedByUserId && (
              <DetailRow label="Người hoàn tất" value={session.completedByUserId} mono />
            )}
          </div>
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-slate-500">Không tìm thấy phiên gửi xe.</p>
      )}
    </Modal>
  )
}
