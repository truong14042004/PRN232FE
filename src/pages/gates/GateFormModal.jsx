import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { gateService } from '../../services/gateService'
import { getErrorMessage } from '../../lib/apiClient'
import { GATE_TYPE_OPTIONS } from '../../lib/enums'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'

const emptyValues = (buildingId = '') => ({
  buildingId,
  code: '',
  name: '',
  type: 3,
})

export default function GateFormModal({
  open,
  mode = 'create',
  gate,
  buildingOptions = [],
  defaultBuildingId = '',
  onClose,
  onSaved,
}) {
  const isEdit = mode === 'edit'
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: emptyValues() })

  useEffect(() => {
    if (!open) return
    if (isEdit && gate) {
      reset({
        buildingId: gate.buildingId || '',
        code: gate.code || '',
        name: gate.name || '',
        type: gate.type ?? 3,
      })
    } else {
      reset(emptyValues(defaultBuildingId))
    }
  }, [open, isEdit, gate, defaultBuildingId, reset])

  const mutation = useMutation({
    mutationFn: (payload) =>
      isEdit ? gateService.update(gate.id, payload) : gateService.create(payload),
    onSuccess: () => {
      toast.success(isEdit ? 'Đã cập nhật cổng' : 'Đã tạo cổng')
      onSaved?.()
      onClose?.()
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Lưu cổng thất bại')),
  })

  const onSubmit = (values) => {
    if (isEdit) {
      // API update: code, name, type, isActive (không đổi building)
      mutation.mutate({
        code: values.code.trim(),
        name: values.name.trim(),
        type: Number(values.type),
        isActive: gate.isActive ?? true,
      })
    } else {
      mutation.mutate({
        buildingId: values.buildingId,
        code: values.code.trim(),
        name: values.name.trim(),
        type: Number(values.type),
      })
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Cập nhật cổng' : 'Thêm cổng'}
      description={isEdit ? 'Chỉnh sửa thông tin cổng.' : 'Tạo cổng ra/vào mới.'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" form="gate-form" loading={mutation.isPending}>
            {isEdit ? 'Lưu thay đổi' : 'Tạo cổng'}
          </Button>
        </>
      }
    >
      <form id="gate-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Select
          label="Tòa nhà"
          placeholder="Chọn tòa nhà"
          disabled={isEdit}
          hint={isEdit ? 'Không thể đổi tòa nhà' : undefined}
          options={buildingOptions}
          error={errors.buildingId?.message}
          {...register('buildingId', {
            validate: (v) => isEdit || !!v || 'Vui lòng chọn tòa nhà',
          })}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Mã cổng"
            placeholder="GATE-01"
            error={errors.code?.message}
            {...register('code', { required: 'Vui lòng nhập mã cổng' })}
          />
          <Input
            label="Tên cổng"
            placeholder="Cổng chính"
            error={errors.name?.message}
            {...register('name', { required: 'Vui lòng nhập tên cổng' })}
          />
        </div>
        <Select label="Loại cổng" options={GATE_TYPE_OPTIONS} {...register('type')} />
      </form>
    </Modal>
  )
}
