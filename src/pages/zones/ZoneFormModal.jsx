import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { zoneService } from '../../services/zoneService'
import { getErrorMessage } from '../../lib/apiClient'
import { useBuildingOptions, useFloorOptions, useVehicleTypeOptions } from '../../hooks/useOptions'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'

const emptyValues = (defaultBuildingId, defaultFloorId) => ({
  buildingId: defaultBuildingId || '',
  floorId: defaultFloorId || '',
  vehicleTypeId: '',
  name: '',
  capacity: 10,
})

export default function ZoneFormModal({
  open,
  mode = 'create',
  zone,
  defaultBuildingId,
  defaultFloorId,
  onClose,
  onSaved,
}) {
  const isEdit = mode === 'edit'
  const { options: buildingOptions } = useBuildingOptions()
  const { options: vehicleTypeOptions } = useVehicleTypeOptions()
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({ defaultValues: emptyValues(defaultBuildingId, defaultFloorId) })

  // Tầng phụ thuộc tòa nhà đang chọn trong form (chỉ ở chế độ tạo).
  const selectedBuilding = watch('buildingId')
  const { options: floorOptions } = useFloorOptions(selectedBuilding)

  useEffect(() => {
    if (!open) return
    if (isEdit && zone) {
      reset({
        buildingId: zone.buildingId || '',
        floorId: zone.floorId || '',
        vehicleTypeId: zone.vehicleTypeId || '',
        name: zone.name || '',
        capacity: zone.capacity ?? 10,
      })
    } else {
      reset(emptyValues(defaultBuildingId, defaultFloorId))
    }
  }, [open, isEdit, zone, defaultBuildingId, defaultFloorId, reset])

  const mutation = useMutation({
    mutationFn: (payload) =>
      isEdit ? zoneService.update(zone.id, payload) : zoneService.create(payload),
    onSuccess: () => {
      toast.success(isEdit ? 'Đã cập nhật khu vực' : 'Đã tạo khu vực')
      onSaved?.()
      onClose?.()
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Lưu khu vực thất bại')),
  })

  const onSubmit = (values) => {
    const capacity = Number(values.capacity)
    if (isEdit) {
      // API update: vehicleTypeId, name, capacity, isActive (không đổi building/floor)
      mutation.mutate({
        vehicleTypeId: values.vehicleTypeId,
        name: values.name.trim(),
        capacity,
        isActive: zone.isActive ?? true,
      })
    } else {
      mutation.mutate({
        buildingId: values.buildingId,
        floorId: values.floorId,
        vehicleTypeId: values.vehicleTypeId,
        name: values.name.trim(),
        capacity,
      })
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Cập nhật khu vực' : 'Thêm khu vực'}
      description={
        isEdit
          ? 'Chỉnh sửa loại xe, tên và sức chứa khu vực.'
          : 'Tạo khu vực mới cho một tầng cụ thể.'
      }
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" form="zone-form" loading={mutation.isPending}>
            {isEdit ? 'Lưu thay đổi' : 'Tạo khu vực'}
          </Button>
        </>
      }
    >
      <form id="zone-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Tòa nhà"
            placeholder="Chọn tòa nhà"
            options={buildingOptions}
            disabled={isEdit}
            hint={isEdit ? 'Không thể đổi tòa nhà sau khi tạo' : undefined}
            error={errors.buildingId?.message}
            {...register('buildingId', {
              validate: (v) => isEdit || !!v || 'Vui lòng chọn tòa nhà',
            })}
          />
          <Select
            label="Tầng"
            placeholder="Chọn tầng"
            options={floorOptions}
            disabled={isEdit || !selectedBuilding}
            hint={isEdit ? 'Không thể đổi tầng sau khi tạo' : undefined}
            error={errors.floorId?.message}
            {...register('floorId', {
              validate: (v) => isEdit || !!v || 'Vui lòng chọn tầng',
            })}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Loại xe"
            placeholder="Chọn loại xe"
            options={vehicleTypeOptions}
            error={errors.vehicleTypeId?.message}
            {...register('vehicleTypeId', { required: 'Vui lòng chọn loại xe' })}
          />
          <Input
            type="number"
            label="Sức chứa"
            placeholder="10"
            error={errors.capacity?.message}
            {...register('capacity', {
              required: 'Vui lòng nhập sức chứa',
              min: { value: 1, message: 'Tối thiểu 1' },
              valueAsNumber: true,
            })}
          />
        </div>
        <Input
          label="Tên khu vực"
          placeholder="Khu A - Ô tô"
          error={errors.name?.message}
          {...register('name', { required: 'Vui lòng nhập tên khu vực' })}
        />
      </form>
    </Modal>
  )
}
