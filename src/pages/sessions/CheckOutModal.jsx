import { useEffect, useState, useRef, useCallback } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { LogOut, Calculator, AlertTriangle, CreditCard, CheckCircle, QrCode } from 'lucide-react'
import { parkingSessionService } from '../../services/parkingSessionService'
import { feePolicyService } from '../../services/feePolicyService'
import { gateService } from '../../services/gateService'
import { paymentService } from '../../services/paymentService'
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
  const [checkoutResult, setCheckoutResult] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('1')
  const [payosLink, setPayosLink] = useState(null)
  const [payosPolling, setPayosPolling] = useState(false)
  const pollRef = useRef(null)

  useEffect(() => {
    if (open && session) {
      setTotalFee(session.totalFee ? String(session.totalFee) : '')
      setExitGate('')
      setNote('')
      setLostTicket(defaultLostTicket)
      setCheckoutResult(null)
      setPaymentMethod('1')
      setPayosLink(null)
      setPayosPolling(false)
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
      if (!session.isMonthly) {
        calcMutation.mutate({
          buildingId: session.buildingId,
          vehicleTypeId: session.vehicleTypeId,
          checkInTime: session.checkInTime,
          checkOutTime: new Date().toISOString(),
          isLostTicket: defaultLostTicket,
        })
      }
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

  const finalizeMutation = useMutation({
    mutationFn: () => parkingSessionService.finalizeCheckOut(session.id),
    onSuccess: (data) => {
      const fee = data?.amount != null ? ` · thu ${formatCurrency(data.amount)}` : ''
      toast.success(
        (lostTicket ? 'Đã xử lý mất thẻ và cho xe ra' : 'Đã cho xe ra bãi') + fee,
      )
      onSaved?.()
      onClose?.()
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Hoàn tất checkout thất bại')),
  })

  const createPayosLinkMutation = useMutation({
    mutationFn: () => paymentService.payosLink(checkoutResult?.paymentId),
    onSuccess: (data) => {
      setPayosLink(data)
      setPayosPolling(true)
      pollRef.current = setInterval(async () => {
        try {
          const status = await paymentService.payosStatus(checkoutResult?.paymentId)
          if (status?.status === 2) {
            clearInterval(pollRef.current)
            pollRef.current = null
            setPayosPolling(false)
            toast.success('Thanh toán PayOS thành công.')
            finalizeMutation.mutate()
          }
        } catch {
          // ignore poll errors
        }
      }, 3000)
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Tạo link PayOS thất bại')),
  })

  const confirmPaymentMutation = useMutation({
    mutationFn: () => paymentService.confirm(checkoutResult?.paymentId),
    onSuccess: () => {
      toast.success('Đã xác nhận thanh toán.')
      finalizeMutation.mutate()
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Xác nhận thanh toán thất bại')),
  })

  const handleCheckoutSuccess = useCallback((data) => {
    if (data?.finalized) {
      const fee = data?.amount != null ? ` · thu ${formatCurrency(data.amount)}` : ''
      toast.success(
        (lostTicket ? 'Đã xử lý mất thẻ và cho xe ra' : 'Đã cho xe ra bãi') + fee,
      )
      onSaved?.()
      onClose?.()
    } else {
      setCheckoutResult(data)
      if (data?.requiresPayment && Number(paymentMethod) === 2) {
        setTimeout(() => createPayosLinkMutation.mutate(), 500)
      }
    }
  }, [lostTicket, paymentMethod, onSaved, onClose])

  const checkOutMutation = useMutation({
    mutationFn: () => {
      let finalNote = note?.trim() || ''
      if (lostTicket) {
        finalNote = `${LOST_TICKET_TAG} ${finalNote}`.trim()
      }
      return parkingSessionService.checkOut(session.id, {
        exitGate: exitGate || undefined,
        isLostTicket: lostTicket,
        checkOutNote: finalNote || undefined,
        paymentMethod: paymentMethod ? Number(paymentMethod) : 1,
      })
    },
    onSuccess: handleCheckoutSuccess,
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
          {checkoutResult?.requiresPayment && Number(paymentMethod) === 1 ? (
            <Button
              variant="primary"
              onClick={() => confirmPaymentMutation.mutate()}
              loading={confirmPaymentMutation.isPending || finalizeMutation.isPending}
            >
              <CreditCard className="h-4 w-4" />
              Xác nhận đã thanh toán
            </Button>
          ) : checkoutResult?.requiresPayment && Number(paymentMethod) === 2 ? (
            <Button
              variant="primary"
              onClick={() => finalizeMutation.mutate()}
              loading={finalizeMutation.isPending}
              disabled={payosPolling}
            >
              <CheckCircle className="h-4 w-4" />
              Đã thanh toán, cho xe ra
            </Button>
          ) : (
            <Button
              variant={lostTicket ? 'danger' : 'primary'}
              onClick={() => checkOutMutation.mutate()}
              loading={checkOutMutation.isPending}
            >
              <LogOut className="h-4 w-4" />
              {lostTicket ? 'Xử lý mất thẻ & cho ra' : 'Xác nhận cho ra'}
            </Button>
          )}
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
              hint="Phí thực tế do hệ thống tính khi xác nhận cho xe ra."
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
            label="Phương thức thanh toán"
            placeholder="Chọn phương thức"
            options={[
              { value: '1', label: 'Tiền mặt' },
              { value: '2', label: 'Chuyển khoản (PayOS QR)' },
            ]}
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          />

          {checkoutResult?.requiresPayment && Number(paymentMethod) === 1 && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-amber-800">
                <AlertTriangle className="h-4 w-4" />
                Cần thanh toán tiền mặt trước khi cho xe ra
              </div>
              <div className="text-sm text-amber-700">
                Số tiền: <span className="font-semibold">{formatCurrency(checkoutResult.amount)}</span>
              </div>
              <p className="text-xs text-amber-600">
                Bấm "Xác nhận đã thanh toán" để ghi nhận thanh toán và cho xe ra bãi.
              </p>
            </div>
          )
          }

          {checkoutResult?.requiresPayment && Number(paymentMethod) === 2 && (
            <div className="rounded-xl border border-sky-300 bg-sky-50 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-sky-800">
                <QrCode className="h-4 w-4" />
                Thanh toán qua PayOS
              </div>
              <div className="text-sm text-sky-700">
                Số tiền: <span className="font-semibold">{formatCurrency(checkoutResult.amount)}</span>
              </div>
              {createPayosLinkMutation.isPending && (
                <p className="text-xs text-sky-600">Đang tạo mã QR...</p>
              )}
              {payosLink?.qrCode && (
                <div className="flex flex-col items-center gap-2">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(payosLink.qrCode)}`}
                    alt="PayOS QR"
                    className="h-48 w-48 rounded-lg border border-sky-200"
                  />
                  {payosLink.checkoutUrl && (
                    <a href={payosLink.checkoutUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-sky-600 underline">
                      Mở link thanh toán
                    </a>
                  )}
                </div>
              )}
              {!payosLink?.qrCode && !createPayosLinkMutation.isPending && (
                <Button
                  variant="secondary"
                  onClick={() => createPayosLinkMutation.mutate()}
                  className="w-full"
                >
                  <QrCode className="h-4 w-4" />
                  Tạo mã QR thanh toán
                </Button>
              )}
              {payosPolling && (
                <p className="text-xs text-sky-600 animate-pulse">Đang chờ thanh toán...</p>
              )}
            </div>
          )
          }

          {checkoutResult?.finalized && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
              <CheckCircle className="h-4 w-4" />
              Đã hoàn tất · Thu {formatCurrency(checkoutResult.amount)}
            </div>
          )}

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
