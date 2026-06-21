import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { paymentService } from '../../services/paymentService'
import { getErrorMessage } from '../../lib/apiClient'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Textarea from '../../components/ui/Textarea'
import Button from '../../components/ui/Button'

export default function CreatePaymentModal({ open, onClose, onCreated, methodOptions }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: { method: 1 } })

  const mutation = useMutation({
    mutationFn: (payload) => paymentService.create(payload),
    onSuccess: () => {
      toast.success('Đã tạo giao dịch thanh toán')
      reset({ method: 1 })
      onCreated?.()
      onClose?.()
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Tạo thanh toán thất bại')),
  })

  const onSubmit = (values) => {
    mutation.mutate({
      parkingSessionId: values.parkingSessionId.trim(),
      plateNumber: values.plateNumber.trim(),
      vehicleId: values.vehicleId?.trim() || undefined,
      shiftId: values.shiftId?.trim() || undefined,
      amount: Number(values.amount),
      method: Number(values.method),
      note: values.note?.trim() || undefined,
    })
  }

  const handleClose = () => {
    reset({ method: 1 })
    onClose?.()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Tạo giao dịch thanh toán"
      description="Nhập thông tin phiên gửi xe và số tiền cần thu."
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            Hủy
          </Button>
          <Button type="submit" form="create-payment-form" loading={mutation.isPending}>
            Tạo giao dịch
          </Button>
        </>
      }
    >
      <form id="create-payment-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Mã phiên gửi xe"
          placeholder="parkingSessionId"
          error={errors.parkingSessionId?.message}
          {...register('parkingSessionId', { required: 'Vui lòng nhập mã phiên gửi xe' })}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Biển số xe"
            placeholder="51A-123.45"
            error={errors.plateNumber?.message}
            {...register('plateNumber', { required: 'Vui lòng nhập biển số' })}
          />
          <Input
            type="number"
            label="Số tiền (VNĐ)"
            placeholder="0"
            error={errors.amount?.message}
            {...register('amount', {
              required: 'Vui lòng nhập số tiền',
              min: { value: 0, message: 'Số tiền không hợp lệ' },
            })}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Phương thức"
            options={methodOptions}
            {...register('method', { required: true })}
          />
          <Input
            label="Mã ca trực (tùy chọn)"
            placeholder="shiftId"
            {...register('shiftId')}
          />
        </div>
        <Input
          label="Mã xe (tùy chọn)"
          placeholder="vehicleId"
          {...register('vehicleId')}
        />
        <Textarea label="Ghi chú (tùy chọn)" placeholder="Ghi chú thêm..." {...register('note')} />
      </form>
    </Modal>
  )
}
