import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { subscriptionService } from '../../services/subscriptionService'
import { getErrorMessage } from '../../lib/apiClient'
import { toDateInput } from '../../lib/format'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Button from '../../components/ui/Button'

// Mặc định: hiệu lực 1 tháng kể từ hôm nay.
const defaultEnd = () => {
  const d = new Date()
  d.setMonth(d.getMonth() + 1)
  return toDateInput(d)
}

const emptyValues = () => ({
  plateNumber: '',
  vehicleTypeId: '',
  buildingId: '',
  ownerName: '',
  ownerPhone: '',
  startDate: toDateInput(new Date()),
  endDate: defaultEnd(),
  monthlyFee: '',
  vehicleId: '',
  note: '',
})

export default function SubscriptionFormModal({ open, mode = 'create', subscription, onClose, onSaved }) {
  const isEdit = mode === 'edit'
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: emptyValues() })

  // Đổ dữ liệu khi mở ở chế độ sửa.
  useEffect(() => {
    if (!open) return
    if (isEdit && subscription) {
      reset({
        plateNumber: subscription.plateNumber || '',
        vehicleTypeId: subscription.vehicleTypeId || '',
        buildingId: subscription.buildingId || '',
        ownerName: subscription.ownerName || '',
        ownerPhone: subscription.ownerPhone || '',
        startDate: toDateInput(subscription.startDate),
        endDate: toDateInput(subscription.endDate),
        monthlyFee: subscription.monthlyFee ?? '',
        vehicleId: subscription.vehicleId || '',
        note: subscription.note || '',
      })
    } else {
      reset(emptyValues())
    }
  }, [open, isEdit, subscription, reset])

  const mutation = useMutation({
    mutationFn: (payload) =>
      isEdit
        ? subscriptionService.update(subscription.id, payload)
        : subscriptionService.create(payload),
    onSuccess: () => {
      toast.success(isEdit ? 'Đã cập nhật vé tháng' : 'Đã tạo vé tháng')
      onSaved?.()
      onClose?.()
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Lưu vé tháng thất bại')),
  })

  const onSubmit = (values) => {
    const base = {
      vehicleTypeId: values.vehicleTypeId.trim(),
      buildingId: values.buildingId.trim(),
      ownerName: values.ownerName.trim(),
      ownerPhone: values.ownerPhone.trim(),
      startDate: new Date(values.startDate).toISOString(),
      endDate: new Date(values.endDate).toISOString(),
      monthlyFee: Number(values.monthlyFee),
      vehicleId: values.vehicleId?.trim() || undefined,
      note: values.note?.trim() || undefined,
    }
    // Biển số chỉ gửi khi tạo mới (API update không nhận plateNumber).
    if (!isEdit) base.plateNumber = values.plateNumber.trim()
    mutation.mutate(base)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Cập nhật vé tháng' : 'Tạo vé tháng'}
      description={
        isEdit
          ? 'Chỉnh sửa thông tin chủ xe, thời hạn và phí.'
          : 'Đăng ký vé tháng mới cho khách hàng.'
      }
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" form="subscription-form" loading={mutation.isPending}>
            {isEdit ? 'Lưu thay đổi' : 'Tạo vé tháng'}
          </Button>
        </>
      }
    >
      <form id="subscription-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Biển số xe"
            placeholder="51A-123.45"
            disabled={isEdit}
            hint={isEdit ? 'Không thể đổi biển số sau khi tạo' : undefined}
            error={errors.plateNumber?.message}
            {...register('plateNumber', {
              validate: (v) => isEdit || !!v.trim() || 'Vui lòng nhập biển số',
            })}
          />
          <Input
            type="number"
            label="Phí hàng tháng (VNĐ)"
            placeholder="0"
            error={errors.monthlyFee?.message}
            {...register('monthlyFee', {
              required: 'Vui lòng nhập phí',
              min: { value: 0, message: 'Phí không hợp lệ' },
            })}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Tên chủ xe"
            placeholder="Nguyễn Văn A"
            error={errors.ownerName?.message}
            {...register('ownerName', { required: 'Vui lòng nhập tên chủ xe' })}
          />
          <Input
            label="Số điện thoại"
            placeholder="0901234567"
            error={errors.ownerPhone?.message}
            {...register('ownerPhone', { required: 'Vui lòng nhập số điện thoại' })}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            type="date"
            label="Ngày bắt đầu"
            error={errors.startDate?.message}
            {...register('startDate', { required: 'Vui lòng chọn ngày bắt đầu' })}
          />
          <Input
            type="date"
            label="Ngày kết thúc"
            error={errors.endDate?.message}
            {...register('endDate', { required: 'Vui lòng chọn ngày kết thúc' })}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Mã loại xe"
            placeholder="vehicleTypeId"
            error={errors.vehicleTypeId?.message}
            {...register('vehicleTypeId', { required: 'Vui lòng nhập mã loại xe' })}
          />
          <Input
            label="Mã tòa nhà"
            placeholder="buildingId"
            error={errors.buildingId?.message}
            {...register('buildingId', { required: 'Vui lòng nhập mã tòa nhà' })}
          />
        </div>

        <Input label="Mã xe (tùy chọn)" placeholder="vehicleId" {...register('vehicleId')} />
        <Textarea label="Ghi chú (tùy chọn)" placeholder="Ghi chú thêm..." {...register('note')} />
      </form>
    </Modal>
  )
}
