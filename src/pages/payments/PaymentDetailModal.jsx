import { useQuery } from '@tanstack/react-query'
import { Copy } from 'lucide-react'
import toast from 'react-hot-toast'
import { paymentService } from '../../services/paymentService'
import { PAYMENT_STATUS, PAYMENT_METHOD } from '../../lib/enums'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import { formatCurrency, formatDateTime } from '../../lib/format'

// Một dòng nhãn — giá trị trong bảng chi tiết.
function DetailRow({ label, value, mono }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2.5 last:border-0">
      <span className="shrink-0 text-sm text-slate-500">{label}</span>
      <span className={`text-right text-sm font-medium text-slate-800 ${mono ? 'font-mono text-xs' : ''}`}>
        {value ?? '—'}
      </span>
    </div>
  )
}

export default function PaymentDetailModal({ paymentId, open, onClose }) {
  const { data: payment, isLoading } = useQuery({
    queryKey: ['payments', 'detail', paymentId],
    queryFn: () => paymentService.get(paymentId),
    enabled: !!paymentId && open,
  })

  const copy = (text) => {
    if (!text) return
    navigator.clipboard?.writeText(String(text))
    toast.success('Đã sao chép')
  }

  return (
    <Modal open={open} onClose={onClose} title="Chi tiết thanh toán" size="md">
      {isLoading ? (
        <Spinner label="Đang tải chi tiết..." />
      ) : payment ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
            <div>
              <p className="text-xs text-slate-400">Số tiền</p>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(payment.amount)}</p>
            </div>
            <Badge color={PAYMENT_STATUS[payment.status]?.color}>
              {PAYMENT_STATUS[payment.status]?.label || payment.status}
            </Badge>
          </div>

          <div>
            <DetailRow label="Biển số" value={payment.plateNumber} />
            <DetailRow
              label="Phương thức"
              value={PAYMENT_METHOD[payment.method]?.label || payment.method}
            />
            <button
              type="button"
              onClick={() => copy(payment.parkingSessionId)}
              className="flex w-full items-start justify-between gap-4 border-b border-slate-100 py-2.5 text-left transition-colors hover:bg-slate-50"
            >
              <span className="shrink-0 text-sm text-slate-500">Mã phiên gửi xe</span>
              <span className="flex items-center gap-1.5 text-right font-mono text-xs font-medium text-slate-800">
                {payment.parkingSessionId || '—'}
                <Copy className="h-3.5 w-3.5 text-slate-400" />
              </span>
            </button>
            <DetailRow label="Mã xe" value={payment.vehicleId} mono />
            <DetailRow label="Mã ca trực" value={payment.shiftId} mono />
            <DetailRow label="Mã giao dịch" value={payment.transactionCode} mono />
            <DetailRow label="Người tạo" value={payment.createdByUserId} mono />
            <DetailRow label="Người xác nhận" value={payment.confirmedByUserId} mono />
            <DetailRow label="Thời gian tạo" value={formatDateTime(payment.createdAt)} />
            <DetailRow label="Thời gian thanh toán" value={formatDateTime(payment.paidAt)} />
            {payment.refundedAt && (
              <DetailRow label="Thời gian hoàn tiền" value={formatDateTime(payment.refundedAt)} />
            )}
            {payment.orderCode != null && (
              <DetailRow label="Mã đơn PayOS" value={payment.orderCode} mono />
            )}
            {payment.note && <DetailRow label="Ghi chú" value={payment.note} />}
          </div>

          {payment.checkoutUrl && (
            <a
              href={payment.checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary w-full"
            >
              Mở link thanh toán PayOS
            </a>
          )}
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-slate-500">Không tìm thấy giao dịch.</p>
      )}
    </Modal>
  )
}
