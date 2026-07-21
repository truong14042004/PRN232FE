import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import Button from '../../components/ui/Button'

export default function RejectSubscriptionDialog({ open, subscription, onClose, onConfirm, loading }) {
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (open) setReason('')
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Từ chối vé tháng</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mb-4 text-sm text-slate-600">
          Từ chối vé tháng của biển số <span className="font-semibold">{subscription?.plateNumber}</span>?
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Lý do từ chối (tùy chọn)..."
          rows={3}
          className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Hủy</Button>
          <Button
            variant="danger"
            onClick={() => onConfirm(reason.trim() || undefined)}
            loading={loading}
          >
            Từ chối
          </Button>
        </div>
      </div>
    </div>
  )
}
