import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { Calculator, Receipt } from 'lucide-react'
import toast from 'react-hot-toast'
import { feePolicyService } from '../../services/feePolicyService'
import { getErrorMessage } from '../../lib/apiClient'
import { PRICING_TYPE } from '../../lib/enums'
import { toDateTimeLocal, formatCurrency } from '../../lib/format'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

// Mặc định: giờ vào là hiện tại, giờ ra là +2 giờ.
const defaultIn = () => toDateTimeLocal(new Date())
const defaultOut = () => {
  const d = new Date()
  d.setHours(d.getHours() + 2)
  return toDateTimeLocal(d)
}

export default function CalculateFeeModal({ open, onClose }) {
  const [result, setResult] = useState(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      buildingId: '',
      vehicleTypeId: '',
      checkInTime: defaultIn(),
      checkOutTime: defaultOut(),
      isLostTicket: false,
    },
  })

  const mutation = useMutation({
    mutationFn: (payload) => feePolicyService.calculate(payload),
    onSuccess: (data) => setResult(data),
    onError: (err) => toast.error(getErrorMessage(err, 'Tính phí thất bại')),
  })

  const onSubmit = (values) => {
    setResult(null)
    mutation.mutate({
      buildingId: values.buildingId.trim(),
      vehicleTypeId: values.vehicleTypeId.trim(),
      checkInTime: new Date(values.checkInTime).toISOString(),
      checkOutTime: new Date(values.checkOutTime).toISOString(),
      isLostTicket: !!values.isLostTicket,
    })
  }

  const handleClose = () => {
    reset()
    setResult(null)
    onClose?.()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Công cụ tính phí"
      description="Ước tính phí gửi xe dựa trên chính sách đang áp dụng."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            Đóng
          </Button>
          <Button type="submit" form="calculate-fee-form" loading={mutation.isPending}>
            <Calculator className="h-4 w-4" />
            Tính phí
          </Button>
        </>
      }
    >
      <form id="calculate-fee-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Mã tòa nhà"
            placeholder="buildingId"
            error={errors.buildingId?.message}
            {...register('buildingId', { required: 'Vui lòng nhập mã tòa nhà' })}
          />
          <Input
            label="Mã loại xe"
            placeholder="vehicleTypeId"
            error={errors.vehicleTypeId?.message}
            {...register('vehicleTypeId', { required: 'Vui lòng nhập mã loại xe' })}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            type="datetime-local"
            label="Giờ vào"
            error={errors.checkInTime?.message}
            {...register('checkInTime', { required: 'Vui lòng chọn giờ vào' })}
          />
          <Input
            type="datetime-local"
            label="Giờ ra"
            error={errors.checkOutTime?.message}
            {...register('checkOutTime', { required: 'Vui lòng chọn giờ ra' })}
          />
        </div>
        <label className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500/30"
            {...register('isLostTicket')}
          />
          <span className="text-sm font-medium text-slate-700">Mất vé (áp dụng phí phạt)</span>
        </label>
      </form>

      {result && (
        <div className="mt-5 rounded-2xl border border-brand-100 bg-brand-50/50 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Tổng phí ước tính</p>
              <p className="mt-1 text-3xl font-bold text-brand-700">
                {formatCurrency(result.amount)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Cách tính</p>
              <p className="text-sm font-semibold text-slate-700">
                {PRICING_TYPE[result.pricingType]?.label || '—'}
              </p>
              {result.duration && (
                <p className="mt-0.5 text-xs text-slate-400">Thời lượng: {result.duration}</p>
              )}
            </div>
          </div>

          {result.breakdown?.length > 0 && (
            <div className="mt-4 space-y-2 border-t border-brand-100 pt-4">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <Receipt className="h-3.5 w-3.5" />
                Chi tiết
              </p>
              {result.breakdown.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">{item.description}</span>
                  <span className="font-medium text-slate-800">{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
