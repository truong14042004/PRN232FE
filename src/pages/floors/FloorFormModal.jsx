import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { floorService } from '../../services/floorService'
import { getErrorMessage } from '../../lib/apiClient'
import { useBuildingOptions } from '../../hooks/useOptions'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'

const emptyValues = (defaultBuildingId) => ({
  buildingId: defaultBuildingId || '',
  floorNumber: 1,
  name: '',
  gridRows: 5,
  gridCols: 8,
})

export default function FloorFormModal({
  open,
  mode = 'create',
  floor,
  defaultBuildingId,
  onClose,
  onSaved,
}) {
  const isEdit = mode === 'edit'
  const { options: buildingOptions } = useBuildingOptions()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: emptyValues(defaultBuildingId) })

  useEffect(() => {
    if (!open) return
    if (isEdit && floor) {
      reset({
        buildingId: floor.buildingId || '',
        floorNumber: floor.floorNumber ?? 1,
        name: floor.name || '',
        gridRows: floor.gridRows ?? 5,
        gridCols: floor.gridCols ?? 8,
      })
    } else {
      reset(emptyValues(defaultBuildingId))
    }
  }, [open, isEdit, floor, defaultBuildingId, reset])

  const mutation = useMutation({
    mutationFn: (payload) =>
      isEdit ? floorService.update(floor.id, payload) : floorService.create(payload),
    onSuccess: () => {
      toast.success(isEdit ? 'Đã cập nhật tầng' : 'Đã tạo tầng')
      onSaved?.()
      onClose?.()
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Lưu tầng thất bại')),
  })

  const onSubmit = (values) => {
    const gridRows = Number(values.gridRows)
    const gridCols = Number(values.gridCols)
    const floorNumber = Number(values.floorNumber)
    if (isEdit) {
      // API update: floorNumber, name, gridRows, gridCols, isActive (không đổi buildingId)
      mutation.mutate({
        floorNumber,
        name: values.name.trim(),
        gridRows,
        gridCols,
        isActive: floor.isActive ?? true,
      })
    } else {
      mutation.mutate({
        buildingId: values.buildingId,
        floorNumber,
        name: values.name.trim(),
        gridRows,
        gridCols,
      })
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Cập nhật tầng' : 'Thêm tầng'}
      description={
        isEdit
          ? 'Chỉnh sửa thông tin tầng và kích thước lưới.'
          : 'Tạo tầng mới và cấu hình lưới chỗ đỗ.'
      }
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" form="floor-form" loading={mutation.isPending}>
            {isEdit ? 'Lưu thay đổi' : 'Tạo tầng'}
          </Button>
        </>
      }
    >
      <form id="floor-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Tên tầng"
            placeholder="Tầng hầm B1"
            error={errors.name?.message}
            {...register('name', { required: 'Vui lòng nhập tên tầng' })}
          />
          <Input
            type="number"
            label="Số thứ tự tầng"
            placeholder="1"
            error={errors.floorNumber?.message}
            {...register('floorNumber', {
              required: 'Vui lòng nhập số tầng',
              valueAsNumber: true,
            })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            type="number"
            label="Số hàng (gridRows)"
            placeholder="5"
            error={errors.gridRows?.message}
            {...register('gridRows', {
              required: 'Bắt buộc',
              min: { value: 1, message: 'Tối thiểu 1' },
              valueAsNumber: true,
            })}
          />
          <Input
            type="number"
            label="Số cột (gridCols)"
            placeholder="8"
            error={errors.gridCols?.message}
            {...register('gridCols', {
              required: 'Bắt buộc',
              min: { value: 1, message: 'Tối thiểu 1' },
              valueAsNumber: true,
            })}
          />
        </div>
        <p className="rounded-xl bg-slate-50/80 px-4 py-3 text-xs text-slate-500">
          Lưới xác định kích thước sơ đồ bãi: số hàng × số cột. Bạn có thể sinh chỗ đỗ hàng loạt
          theo lưới này ở trang Chỗ đỗ.
        </p>
      </form>
    </Modal>
  )
}
