import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { feePolicyService } from '../../services/feePolicyService'
import { getErrorMessage } from '../../lib/apiClient'
import { PRICING_TYPE_OPTIONS } from '../../lib/enums'
import { toDateInput } from '../../lib/format'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'

const emptyValues = () => ({
  name: '',
  buildingId: '',
  vehicleTypeId: '',
  pricingType: 1,
  basePrice: '',
  hourlyPrice: '',
  dailyPrice: '',
  monthlyPrice: '',
  lostTicketFee: '',
  overtimeFee: '',
  overtimeAfterHours: 24,
  effectiveFrom: toDateInput(new Date()),
  effectiveTo: '',
})

export default function FeePolicyFormModal({ open, mode = 'create', policy, onClose, onSaved }) {
  const isEdit = mode === 'edit'
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: emptyValues() })

  useEffect(() => {
    if (!open) return
    if (isEdit && policy) {
      reset({
        name: policy.name || '',
        buildingId: policy.buildingId || '',
        vehicleTypeId: policy.vehicleTypeId || '',
        pricingType: policy.pricingType ?? 1,
        basePrice: policy.basePrice ?? '',
        hourlyPrice: policy.hourlyPrice ?? '',
        dailyPrice: policy.dailyPrice ?? '',
        monthlyPrice: policy.monthlyPrice ?? '',
        lostTicketFee: policy.lostTicketFee ?? '',
        overtimeFee: policy.overtimeFee ?? '',
        overtimeAfterHours: policy.overtimeAfterHours ?? 24,
        effectiveFrom: toDateInput(policy.effectiveFrom),
        effectiveTo: policy.effectiveTo ? toDateInput(policy.effectiveTo) : '',
      })
    } else {
      reset(emptyValues())
    }
  }, [open, isEdit, policy, reset])

  const mutation = useMutation({
    mutationFn: (payload) =>
      isEdit ? feePolicyService.update(policy.id, payload) : feePolicyService.create(payload),
    onSuccess: () => {
      toast.success(isEdit ? 'Đã cập nhật chính sách phí' : 'Đã tạo chính sách phí')
      onSaved?.()
      onClose?.()
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Lưu chính sách phí thất bại')),
  })

  // Số tùy chọn: trả về undefined nếu rỗng để API nhận null.
  const optNum = (v) => (v === '' || v == null ? undefined : Number(v))

  const onSubmit = (values) => {
    const base = {
      name: values.name.trim(),
      pricingType: Number(values.pricingType),
      basePrice: Number(values.basePrice),
      hourlyPrice: optNum(values.hourlyPrice),
      dailyPrice: optNum(values.dailyPrice),
      monthlyPrice: optNum(values.monthlyPrice),
      lostTicketFee: Number(values.lostTicketFee || 0),
      overtimeFee: Number(values.overtimeFee || 0),
      overtimeAfterHours: optNum(values.overtimeAfterHours),
      effectiveFrom: values.effectiveFrom
        ? new Date(values.effectiveFrom).toISOString()
        : undefined,
      effectiveTo: values.effectiveTo ? new Date(values.effectiveTo).toISOString() : undefined,
    }
    // buildingId + vehicleTypeId chỉ gửi khi tạo mới (API update không nhận hai field này).
    if (!isEdit) {
      base.buildingId = values.buildingId.trim()
      base.vehicleTypeId = values.vehicleTypeId.trim()
    }
    if (isEdit) base.isActive = policy.isActive
    mutation.mutate(base)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Cập nhật chính sách phí' : 'Tạo chính sách phí'}
      description="Thiết lập bảng giá cho từng loại xe và tòa nhà."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" form="fee-policy-form" loading={mutation.isPending}>
            {isEdit ? 'Lưu thay đổi' : 'Tạo chính sách'}
          </Button>
        </>
      }
    >
      <form id="fee-policy-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Tên chính sách"
            placeholder="VD: Xe máy theo giờ"
            error={errors.name?.message}
            {...register('name', { required: 'Vui lòng nhập tên chính sách' })}
          />
          <Select
            label="Loại tính phí"
            options={PRICING_TYPE_OPTIONS}
            {...register('pricingType', { required: true })}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Mã loại xe"
            placeholder="vehicleTypeId"
            disabled={isEdit}
            hint={isEdit ? 'Không thể đổi loại xe sau khi tạo' : undefined}
            error={errors.vehicleTypeId?.message}
            {...register('vehicleTypeId', {
              validate: (v) => isEdit || !!v.trim() || 'Vui lòng nhập mã loại xe',
            })}
          />
          <Input
            label="Mã tòa nhà"
            placeholder="buildingId"
            disabled={isEdit}
            hint={isEdit ? 'Không thể đổi tòa nhà sau khi tạo' : undefined}
            error={errors.buildingId?.message}
            {...register('buildingId', {
              validate: (v) => isEdit || !!v.trim() || 'Vui lòng nhập mã tòa nhà',
            })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Input
            type="number"
            label="Giá cơ bản"
            placeholder="0"
            error={errors.basePrice?.message}
            {...register('basePrice', {
              required: 'Bắt buộc',
              min: { value: 0, message: 'Không hợp lệ' },
            })}
          />
          <Input type="number" label="Giá theo giờ" placeholder="0" {...register('hourlyPrice')} />
          <Input type="number" label="Giá theo ngày" placeholder="0" {...register('dailyPrice')} />
          <Input
            type="number"
            label="Giá theo tháng"
            placeholder="0"
            {...register('monthlyPrice')}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Input
            type="number"
            label="Phí mất vé"
            placeholder="0"
            {...register('lostTicketFee')}
          />
          <Input
            type="number"
            label="Phí quá giờ"
            placeholder="0"
            {...register('overtimeFee')}
          />
          <Input
            type="number"
            label="Quá giờ sau (giờ)"
            placeholder="24"
            hint="Gửi quá số giờ này mới tính phí quá giờ"
            {...register('overtimeAfterHours')}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            type="date"
            label="Hiệu lực từ"
            error={errors.effectiveFrom?.message}
            {...register('effectiveFrom')}
          />
          <Input
            type="date"
            label="Hiệu lực đến (tùy chọn)"
            {...register('effectiveTo')}
          />
        </div>
      </form>
    </Modal>
  )
}
