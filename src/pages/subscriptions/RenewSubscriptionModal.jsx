import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { RefreshCw, CalendarClock } from 'lucide-react'
import toast from 'react-hot-toast'
import { subscriptionService } from '../../services/subscriptionService'
import { getErrorMessage } from '../../lib/apiClient'
import { formatDate, formatCurrency } from '../../lib/format'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'

const MONTH_OPTIONS = [1, 2, 3, 6, 12]

export default function RenewSubscriptionModal({ open, subscription, onClose, onRenewed }) {
  const [months, setMonths] = useState(1)

  useEffect(() => {
    if (open) setMonths(1)
  }, [open])

  const mutation = useMutation({
    mutationFn: (m) => subscriptionService.renew(subscription.id, m),
    onSuccess: () => {
      toast.success(`Đã gia hạn vé tháng thêm ${months} tháng`)
      onRenewed?.()
      onClose?.()
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Gia hạn thất bại')),
  })

  // Ước tính ngày kết thúc mới và chi phí gia hạn.
  const projectedEnd = (() => {
    if (!subscription?.endDate) return null
    const d = new Date(subscription.endDate)
    if (Number.isNaN(d.getTime())) return null
    d.setMonth(d.getMonth() + months)
    return d
  })()

  const projectedCost = subscription?.monthlyFee != null ? subscription.monthlyFee * months : null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Gia hạn vé tháng"
      description={
        subscription ? `Gia hạn vé tháng cho biển số ${subscription.plateNumber}.` : undefined
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={() => mutation.mutate(months)} loading={mutation.isPending}>
            <RefreshCw className="h-4 w-4" />
            Gia hạn {months} tháng
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Số tháng gia hạn</p>
          <div className="grid grid-cols-5 gap-2">
            {MONTH_OPTIONS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMonths(m)}
                className={
                  'rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all ' +
                  (months === m
                    ? 'border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-500/20'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50')
                }
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {subscription && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3 rounded-xl bg-slate-50/80 p-4"
          >
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Hết hạn hiện tại</span>
              <span className="font-medium text-slate-700">{formatDate(subscription.endDate)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-slate-500">
                <CalendarClock className="h-4 w-4" />
                Hết hạn dự kiến
              </span>
              <span className="font-semibold text-brand-600">{formatDate(projectedEnd)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200/70 pt-3 text-sm">
              <span className="text-slate-500">Chi phí gia hạn</span>
              <span className="text-lg font-bold text-slate-900">
                {formatCurrency(projectedCost)}
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </Modal>
  )
}
