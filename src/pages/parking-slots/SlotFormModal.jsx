import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { parkingSlotService } from '../../services/parkingSlotService'
import { getErrorMessage } from '../../lib/apiClient'
import {
  useBuildingOptions,
  useFloorOptions,
  useZoneOptions,
  useVehicleTypeOptions,
} from '../../hooks/useOptions'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'

const emptyValues = (b, f, z) => ({
  buildingId: b || '',
  floorId: f || '',
  zoneId: z || '',
  vehicleTypeId: '',
  code: '',
  label: '',
  row: 1,
  column: 1,
  rowSpan: 1,
  colSpan: 1,
})

export default function SlotFormModal({
  open,
  mode = 'create',
  slot,
  defaultBuildingId,
  defaultFloorId,
  defaultZoneId,
  onClose,
  onSaved,
}) {
  const isEdit = mode === 'edit'
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({ defaultValues: emptyValues(defaultBuildingId, defaultFloorId, defaultZoneId) })

  const buildingId = watch('buildingId')
  const floorId = watch('floorId')

  const { options: buildingOptions } = useBuildingOptions()
  const { options: vehicleTypeOptions } = useVehicleTypeOptions()
  const { options: floorOptions } = useFloorOptions(buildingId)
  const { options: zoneOptions } = useZoneOptions(buildingId, floorId)

  useEffect(() => {
    if (!open) return
    if (isEdit && slot) {
      reset({
        buildingId: slot.buildingId || '',
        floorId: slot.floorId || '',
        zoneId: slot.zoneId || '',
        vehicleTypeId: slot.vehicleTypeId || '',
        code: slot.code || '',
        label: slot.label || '',
        row: slot.row ?? 1,
        column: slot.column ?? 1,
        rowSpan: slot.rowSpan ?? 1,
        colSpan: slot.colSpan ?? 1,
      })
    } else {
      reset(emptyValues(defaultBuildingId, defaultFloorId, defaultZoneId))
    }
  }, [open, isEdit, slot, defaultBuildingId, defaultFloorId, defaultZoneId, reset])

  const mutation = useMutation({
    mutationFn: (payload) =>
      isEdit ? parkingSlotService.update(slot.id, payload) : parkingSlotService.create(payload),
    onSuccess: () => {
      toast.success(isEdit ? 'Đã cập nhật chỗ đỗ' : 'Đã tạo chỗ đỗ')
      onSaved?.()
      onClose?.()
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Lưu chỗ đỗ thất bại')),
  })

  const onSubmit = (values) => {
    if (isEdit) {
      // API update: zoneId, vehicleTypeId, code, label (không đổi vị trí ở đây)
      mutation.mutate({
        zoneId: values.zoneId,
        vehicleTypeId: values.vehicleTypeId,
        code: values.code.trim(),
        label: values.label?.trim() || undefined,
      })
    } else {
      mutation.mutate({
        buildingId: values.buildingId,
        floorId: values.floorId,
        zoneId: values.zoneId,
        vehicleTypeId: values.vehicleTypeId,
        code: values.code.trim(),
        label: values.label?.trim() || undefined,
        row: Number(values.row),
        column: Number(values.column),
        rowSpan: Number(values.rowSpan),
        colSpan: Number(values.colSpan),
      })
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Cập nhật chỗ đỗ' : 'Thêm chỗ đỗ'}
      description={
        isEdit
          ? 'Chỉnh sửa khu vực, loại xe và nhãn chỗ đỗ.'
          : 'Tạo một chỗ đỗ mới và đặt vị trí trên lưới.'
      }
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" form="slot-form" loading={mutation.isPending}>
            {isEdit ? 'Lưu thay đổi' : 'Tạo chỗ đỗ'}
          </Button>
        </>
      }
    >
      <form id="slot-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {!isEdit && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Tòa nhà"
              placeholder="Chọn tòa nhà"
              options={buildingOptions}
              error={errors.buildingId?.message}
              {...register('buildingId', { required: 'Vui lòng chọn tòa nhà' })}
            />
            <Select
              label="Tầng"
              placeholder={buildingId ? 'Chọn tầng' : 'Chọn tòa nhà trước'}
              options={floorOptions}
              disabled={!buildingId}
              error={errors.floorId?.message}
              {...register('floorId', { required: 'Vui lòng chọn tầng' })}
            />
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Khu vực"
            placeholder={buildingId || isEdit ? 'Chọn khu vực' : 'Chọn tòa nhà trước'}
            options={zoneOptions}
            disabled={!isEdit && !buildingId}
            error={errors.zoneId?.message}
            {...register('zoneId', { required: 'Vui lòng chọn khu vực' })}
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
          <Input
            label="Mã chỗ đỗ"
            placeholder="A-01"
            error={errors.code?.message}
            {...register('code', { required: 'Vui lòng nhập mã chỗ' })}
          />
          <Input label="Nhãn (tùy chọn)" placeholder="Gần thang máy" {...register('label')} />
        </div>

        {!isEdit && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                label="Hàng (row)"
                error={errors.row?.message}
                {...register('row', { required: 'Bắt buộc', min: { value: 1, message: 'Tối thiểu 1' } })}
              />
              <Input
                type="number"
                label="Cột (column)"
                error={errors.column?.message}
                {...register('column', {
                  required: 'Bắt buộc',
                  min: { value: 1, message: 'Tối thiểu 1' },
                })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                label="Số hàng chiếm (rowSpan)"
                {...register('rowSpan', { min: { value: 1, message: 'Tối thiểu 1' } })}
              />
              <Input
                type="number"
                label="Số cột chiếm (colSpan)"
                {...register('colSpan', { min: { value: 1, message: 'Tối thiểu 1' } })}
              />
            </div>
            <p className="rounded-xl bg-slate-50/80 px-4 py-3 text-xs text-slate-500">
              Vị trí (hàng, cột) xác định chỗ đỗ nằm ở đâu trên sơ đồ lưới của tầng. Để đổi vị trí
              sau khi tạo, dùng chức năng kéo thả trên sơ đồ bãi (sắp tới) hoặc cập nhật riêng.
            </p>
          </>
        )}
      </form>
    </Modal>
  )
}
