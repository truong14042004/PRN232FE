import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { vehicleTypeService } from '../../services/vehicleTypeService'
import { getErrorMessage } from '../../lib/apiClient'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Textarea from '../../components/ui/Textarea'
import Button from '../../components/ui/Button'

const emptyValues = () => ({ name: '', description: '', category: '1' })

export default function VehicleTypeFormModal({ open, mode = 'create', vehicleType, onClose, onSaved }) {
  const isEdit = mode === 'edit'
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({ defaultValues: emptyValues() })

  useEffect(() => {
    if (!open) return
    if (isEdit && vehicleType) {
      reset({
        name: vehicleType.name || '',
        description: vehicleType.description || '',
        category: String(vehicleType.category ?? 1),
      })
    } else {
      reset(emptyValues())
    }
  }, [open, isEdit, vehicleType, reset])

  const mutation = useMutation({
    mutationFn: (payload) =>
      isEdit ? vehicleTypeService.update(vehicleType.id, payload) : vehicleTypeService.create(payload),
    onSuccess: () => {
      toast.success(isEdit ? 'Đã cập nhật loại xe' : 'Đã tạo loại xe')
      onSaved?.()
      onClose?.()
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Lưu loại xe thất bại')),
  })

  const onSubmit = (values) => {
    const payload = {
      name: values.name.trim(),
      description: values.description?.trim() || undefined,
      category: Number(values.category),
    }
    if (isEdit) payload.isActive = vehicleType.isActive ?? true
    mutation.mutate(payload)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Cập nhật loại xe' : 'Thêm loại xe'}
      description={isEdit ? 'Chỉnh sửa thông tin loại xe.' : 'Tạo loại phương tiện mới.'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" form="vehicle-type-form" loading={mutation.isPending}>
            {isEdit ? 'Lưu thay đổi' : 'Tạo loại xe'}
          </Button>
        </>
      }
    >
      <form id="vehicle-type-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Tên loại xe"
          placeholder="Xe máy, Ô tô con..."
          error={errors.name?.message}
          {...register('name', { required: 'Vui lòng nhập tên loại xe' })}
        />
        <Select
          label="Phân loại"
          value={watch('category')}
          onChange={(e) => setValue('category', e.target.value)}
          options={[
            { value: '1', label: 'Xe máy' },
            { value: '2', label: 'Ô tô' },
          ]}
        />
        <Textarea
          label="Mô tả (tùy chọn)"
          placeholder="Ghi chú thêm về loại xe..."
          {...register('description')}
        />
      </form>
    </Modal>
  )
}
