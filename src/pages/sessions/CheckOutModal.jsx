import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { LogOut, Calculator, AlertTriangle } from 'lucide-react'
import { parkingSessionService } from '../../services/parkingSessionService'
import { feePolicyService } from '../../services/feePolicyService'
import { gateService } from '../../services/gateService'
import { getErrorMessage } from '../../lib/apiClient'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Textarea from '../../components/ui/Textarea'
import Button from '../../components/ui/Button'
import { formatCurrency, formatDateTime } from '../../lib/format'
import { cn } from '../../lib/cn'

const LOST_TICKET_TAG = '[MẤT THẺ]'

export default function CheckOutModal({ open, session, onClose, onSaved, defaultLostTicket = false }) {
  const [totalFee, setTotalFee] = useState('')
  const [exitGate, setExitGate] = useState('')
  const [note, setNote] = useState('')
  const [lostTicket, setLostTicket] = useState(false)
  const [calculating, setCalculating] = useState(false)

  useEffect(() => {
    if (open && session) {
      setTotalFee(session.totalFee ? String(session.totalFee) : '')
      setExitGate('')
      setNote('')
      setLostTicket(defaultLostTicket)
    }
  }, [open, session, defaultLostTicket])

  // Cổng ra theo tòa nhà (Exit=2 hoặc Both=3).
  const { data: gatesData } = useQuery({
    queryKey: ['gates', 'options', session?.buildingId],
    queryFn: () => gateService.list({ buildingId: session.buildingId, isActive: true, pageSize: 200 }),
    enabled: !!session?.buildingId && open,
  })
  const gateOptions = (gatesData?.items || [])
    .filter((g) => g.type === 2 || g.type === 3)
    .map((g) => ({ value: g.code, label: `${g.name} (${g.code})` }))

  // Tính phí tự động dựa trên chính sách + thời gian gửi (có tính phí mất thẻ nếu bật).
  const calcMutation = useMutation({
    mutationFn: (payload) => feePolicyService.calculate(payload),
    onSuccess: (data) => {
      if (data?.amount != null) {
        setTotalFee(String(data.amount))
        toast.success(`Phí ${lostTicket ? '(gồm phạt mất thẻ) ' : ''}gợi ý: ${formatCurrency(data.amount)}`)
      }
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Tính phí thất bại')),
  })

  const handleCalculate = async () => {
    if (!session) return
    setCalculating(true)
    try {
      await calcMutation.mutateAsync({
        buildingId: session.buildingId,
        vehicleTypeId: session.vehicleTypeId,
        checkInTime: session.checkInTime,
        checkOutTime: new Date().toISOString(),
        isLostTicket: lostTicket,
      })
    } finally {
      setCalculating(false)
    }
  }

  const checkOutMutation = useMutation({
    mutationFn: () => {
      // Khi mất thẻ, gắn nhãn vào ghi chú để truy vết.
      let finalNote = note?.trim() || ''
      if (lostTicket) {
        finalNote = `${LOST_TICKET_TAG} ${finalNote}`.trim()
      }
      return parkingSessionService.checkOut(session.id, {
        exitGate: exitGate || undefined,
        isLostTicket: lostTicket,
        checkOutNote: finalNote || undefined,
      })
    },
    onSuccess: () => {
      toast.success(lostTicket ? 'Đã xử lý mất thẻ và cho xe ra' : 'Đã cho xe ra bãi')
      onSaved?.()
      onClose?.()
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Cho xe ra thất bại')),
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Cho xe ra bãi"
      description={
        session ? `Tính phí và hoàn tất phiên gửi xe biển số ${session.plateNumber}.` : undefined
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button
            variant={lostTicket ? 'danger' : 'primary'}
            onClick={() => checkOutMutation.mutate()}
            loading={checkOutMutation.isPending}
          >
            <LogOut className="h-4 w-4" />
            {lostTicket ? 'Xử lý mất thẻ & cho ra' : 'Xác nhận cho ra'}
          </Button>
        </>
      }
    >
      {session && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50/80 p-4 text-sm">
            <div>
              <p className="text-xs text-slate-400">Biển số</p>
              <p className="font-semibold text-slate-800">{session.plateNumber}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Giờ vào</p>
              <p className="font-medium text-slate-700">{formatDateTime(session.checkInTime)}</p>
            </div>
            {session.isMonthly && (
              <div className="col-span-2">
                <span className="inline-flex rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700">
                  Xe vé tháng
                </span>
              </div>
            )}
          </div>

          {/* Công tắc xử lý mất thẻ */}
          <label
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors',
              lostTicket
                ? 'border-red-300 bg-red-50'
                : 'border-slate-200 bg-white hover:bg-slate-50',
            )}
          >
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500/30"
              checked={lostTicket}
              onChange={(e) => setLostTicket(e.target.checked)}
            />
            <span className="flex-1">
              <span className="flex items-center gap-1.5 text-sm font-medium text-slate-800">
                <AlertTriangle
                  className={cn('h-4 w-4', lostTicket ? 'text-red-500' : 'text-slate-400')}
                />
                Khách làm mất thẻ gửi xe
              </span>
              <span className="mt-0.5 block text-xs text-slate-500">
                Áp dụng phí phạt mất thẻ theo chính sách. Bấm “Tính phí” để cập nhật số tiền.
              </span>
            </span>
          </label>

          <div className="flex items-end gap-2">
            <Input
              type="number"
              label="Phí dự kiến (VNĐ)"
              placeholder="0"
              value={totalFee}
              readOnly
              containerClassName="flex-1"
            />
            <Button
              variant="secondary"
              onClick={handleCalculate}
              loading={calculating || calcMutation.isPending}
              className="shrink-0"
            >
              <Calculator className="h-4 w-4" />
              Tính phí
            </Button>
          </div>

          <Select
            label="Cổng ra (tùy chọn)"
            placeholder="Chọn cổng ra"
            options={gateOptions}
            value={exitGate}
            onChange={(e) => setExitGate(e.target.value)}
          />

          <Textarea
            label="Ghi chú (tùy chọn)"
            placeholder="Ghi chú thêm..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      )}
    </Modal>
  )
}
