import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { buildingService } from '../../services/buildingService'
import { getErrorMessage } from '../../lib/apiClient'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Button from '../../components/ui/Button'

const emptyValues = () => ({
  name: '',
  address: '',
  description: '',
  phoneNumber: '',
  openingTime: '',
  closingTime: '',
})

// Chuẩn hóa TimeOnly "HH:mm:ss" -> "HH:mm" cho input type=time.
const toTimeInput = (v) => (v ? String(v).slice(0, 5) : '')
// "HH:mm" -> "HH:mm:ss" gửi lên API (TimeOnly).
const toTimeSpan = (v) => (v ? `${v}:00` : undefined)

export default function BuildingFormModal({ open, mode = 'create', building, onClose, onSaved }) {
  const isEdit = mode === 'edit'
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: emptyValues() })

  useEffect(() => {
    if (!open) return
    if (isEdit && building) {
      reset({
        name: building.name || '',
        address: building.address || '',
        description: building.description || '',
        phoneNumber: building.phoneNumber || '',
        openingTime: toTimeInput(building.openingTime),
        closingTime: toTimeInput(building.closingTime),
      })
    } else {
      reset(emptyValues())
    }
  }, [open, isEdit, building, reset])

  const mutation = useMutation({
    mutationFn: (payload) =>
      isEdit ? buildingService.update(building.id, payload) : buildingService.create(payload),
    onSuccess: () => {
      toast.success(isEdit ? 'Đã cập nhật tòa nhà' : 'Đã tạo tòa nhà')
      onSaved?.()
      onClose?.()
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Lưu tòa nhà thất bại')),
  })

  const onSubmit = (values) => {
    const payload = {
      name: values.name.trim(),
      address: values.address.trim(),
      description: values.description?.trim() || undefined,
      phoneNumber: values.phoneNumber?.trim() || undefined,
      openingTime: toTimeSpan(values.openingTime),
      closingTime: toTimeSpan(values.closingTime),
    }
    // API update yêu cầu isActive; giữ nguyên trạng thái hiện tại khi sửa.
    if (isEdit) payload.isActive = building.isActive ?? true
    mutation.mutate(payload)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Cập nhật tòa nhà' : 'Thêm tòa nhà'}
      description={
        isEdit ? 'Chỉnh sửa thông tin tòa nhà.' : 'Tạo tòa nhà mới trong hệ thống.'
      }
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" form="building-form" loading={mutation.isPending}>
            {isEdit ? 'Lưu thay đổi' : 'Tạo tòa nhà'}
          </Button>
        </>
      }
    >
      <form id="building-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Tên tòa nhà"
          placeholder="Tòa nhà A"
          error={errors.name?.message}
          {...register('name', { required: 'Vui lòng nhập tên tòa nhà' })}
        />
        <Input
          label="Địa chỉ"
          placeholder="123 Đường ABC, Quận 1, TP.HCM"
          error={errors.address?.message}
          {...register('address', { required: 'Vui lòng nhập địa chỉ' })}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Số điện thoại (tùy chọn)"
            placeholder="0901234567"
            {...register('phoneNumber')}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input type="time" label="Giờ mở cửa" {...register('openingTime')} />
            <Input type="time" label="Giờ đóng cửa" {...register('closingTime')} />
          </div>
        </div>
        <Textarea
          label="Mô tả (tùy chọn)"
          placeholder="Ghi chú thêm về tòa nhà..."
          {...register('description')}
        />
      </form>
    </Modal>
  )
}
