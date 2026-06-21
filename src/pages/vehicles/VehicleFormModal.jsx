import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { vehicleService } from '../../services/vehicleService'
import { getErrorMessage } from '../../lib/apiClient'
import { useVehicleTypeOptions } from '../../hooks/useOptions'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Textarea from '../../components/ui/Textarea'
import Button from '../../components/ui/Button'

const emptyValues = () => ({
  plateNumber: '',
  vehicleTypeId: '',
  ownerName: '',
  ownerPhone: '',
  ownerEmail: '',
  brand: '',
  model: '',
  color: '',
  note: '',
})

export default function VehicleFormModal({ open, mode = 'create', vehicle, onClose, onSaved }) {
  const isEdit = mode === 'edit'
  const { options: vehicleTypeOptions } = useVehicleTypeOptions()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: emptyValues() })

  useEffect(() => {
    if (!open) return
    if (isEdit && vehicle) {
      reset({
        plateNumber: vehicle.plateNumber || '',
        vehicleTypeId: vehicle.vehicleTypeId || '',
        ownerName: vehicle.ownerName || '',
        ownerPhone: vehicle.ownerPhone || '',
        ownerEmail: vehicle.ownerEmail || '',
        brand: vehicle.brand || '',
        model: vehicle.model || '',
        color: vehicle.color || '',
        note: vehicle.note || '',
      })
    } else {
      reset(emptyValues())
    }
  }, [open, isEdit, vehicle, reset])

  const mutation = useMutation({
    mutationFn: (payload) =>
      isEdit ? vehicleService.update(vehicle.id, payload) : vehicleService.create(payload),
    onSuccess: () => {
      toast.success(isEdit ? 'Đã cập nhật phương tiện' : 'Đã thêm phương tiện')
      onSaved?.()
      onClose?.()
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Lưu phương tiện thất bại')),
  })

  const onSubmit = (values) => {
    const base = {
      vehicleTypeId: values.vehicleTypeId,
      ownerName: values.ownerName?.trim() || undefined,
      ownerPhone: values.ownerPhone?.trim() || undefined,
      ownerEmail: values.ownerEmail?.trim() || undefined,
      brand: values.brand?.trim() || undefined,
      model: values.model?.trim() || undefined,
      color: values.color?.trim() || undefined,
      note: values.note?.trim() || undefined,
    }
    if (isEdit) {
      // API update không nhận plateNumber, nhưng cần isActive.
      base.isActive = vehicle.isActive ?? true
    } else {
      base.plateNumber = values.plateNumber.trim()
    }
    mutation.mutate(base)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Cập nhật phương tiện' : 'Thêm phương tiện'}
      description={
        isEdit ? 'Chỉnh sửa thông tin phương tiện và chủ xe.' : 'Đăng ký phương tiện mới vào hệ thống.'
      }
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" form="vehicle-form" loading={mutation.isPending}>
            {isEdit ? 'Lưu thay đổi' : 'Thêm phương tiện'}
          </Button>
        </>
      }
    >
      <form id="vehicle-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
          <Select
            label="Loại xe"
            placeholder="Chọn loại xe"
            options={vehicleTypeOptions}
            error={errors.vehicleTypeId?.message}
            {...register('vehicleTypeId', { required: 'Vui lòng chọn loại xe' })}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Tên chủ xe (tùy chọn)" placeholder="Nguyễn Văn A" {...register('ownerName')} />
          <Input
            label="Số điện thoại (tùy chọn)"
            placeholder="0901234567"
            {...register('ownerPhone')}
          />
        </div>

        <Input
          type="email"
          label="Email chủ xe (tùy chọn)"
          placeholder="email@example.com"
          {...register('ownerEmail')}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input label="Hãng (tùy chọn)" placeholder="Toyota" {...register('brand')} />
          <Input label="Mẫu xe (tùy chọn)" placeholder="Vios" {...register('model')} />
          <Input label="Màu sắc (tùy chọn)" placeholder="Trắng" {...register('color')} />
        </div>

        <Textarea label="Ghi chú (tùy chọn)" placeholder="Ghi chú thêm..." {...register('note')} />
      </form>
    </Modal>
  )
}
