import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Grid2x2Plus } from 'lucide-react'
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

const emptyValues = (defaultBuildingId, defaultFloorId, defaultZoneId) => ({
  buildingId: defaultBuildingId || '',
  floorId: defaultFloorId || '',
  zoneId: defaultZoneId || '',
  vehicleTypeId: '',
  startRow: 1,
  startColumn: 1,
  rows: 3,
  cols: 5,
  codePrefix: 'A',
})

export default function GenerateGridModal({
  open,
  defaultBuildingId,
  defaultFloorId,
  defaultZoneId,
  onClose,
  onSaved,
}) {
  const { options: buildingOptions } = useBuildingOptions()
  const { options: vehicleTypeOptions } = useVehicleTypeOptions()
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: emptyValues(defaultBuildingId, defaultFloorId, defaultZoneId),
  })

  const buildingId = watch('buildingId')
  const floorId = watch('floorId')
  const rows = Number(watch('rows')) || 0
  const cols = Number(watch('cols')) || 0

  const { options: floorOptions } = useFloorOptions(buildingId)
  const { options: zoneOptions } = useZoneOptions(buildingId, floorId)

  useEffect(() => {
    if (open) reset(emptyValues(defaultBuildingId, defaultFloorId, defaultZoneId))
  }, [open, defaultBuildingId, defaultFloorId, defaultZoneId, reset])

  const mutation = useMutation({
    mutationFn: (payload) => parkingSlotService.generateGrid(payload),
    onSuccess: (slots) => {
      toast.success(`Đã sinh ${slots?.length ?? 0} chỗ đỗ`)
      onSaved?.()
      onClose?.()
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Sinh lưới thất bại')),
  })

  const onSubmit = (values) => {
    mutation.mutate({
      floorId: values.floorId,
      zoneId: values.zoneId,
      vehicleTypeId: values.vehicleTypeId,
      startRow: Number(values.startRow),
      startColumn: Number(values.startColumn),
      rows: Number(values.rows),
      cols: Number(values.cols),
      codePrefix: values.codePrefix.trim(),
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Sinh chỗ đỗ theo lưới"
      description="Tạo hàng loạt chỗ đỗ trong một khu vực theo lưới hàng × cột."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" form="generate-grid-form" loading={mutation.isPending}>
            <Grid2x2Plus className="h-4 w-4" />
            Sinh {rows > 0 && cols > 0 ? `${rows * cols} chỗ` : 'lưới'}
          </Button>
        </>
      }
    >
      <form id="generate-grid-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Khu vực"
            placeholder={buildingId ? 'Chọn khu vực' : 'Chọn tòa nhà trước'}
            options={zoneOptions}
            disabled={!buildingId}
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

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Input
            type="number"
            label="Hàng bắt đầu"
            error={errors.startRow?.message}
            {...register('startRow', { required: 'Bắt buộc', min: { value: 1, message: '≥ 1' } })}
          />
          <Input
            type="number"
            label="Cột bắt đầu"
            error={errors.startColumn?.message}
            {...register('startColumn', { required: 'Bắt buộc', min: { value: 1, message: '≥ 1' } })}
          />
          <Input
            type="number"
            label="Số hàng"
            error={errors.rows?.message}
            {...register('rows', { required: 'Bắt buộc', min: { value: 1, message: '≥ 1' } })}
          />
          <Input
            type="number"
            label="Số cột"
            error={errors.cols?.message}
            {...register('cols', { required: 'Bắt buộc', min: { value: 1, message: '≥ 1' } })}
          />
        </div>

        <Input
          label="Tiền tố mã chỗ"
          placeholder="A"
          hint="Ví dụ tiền tố A sẽ tạo mã A1, A2, A3..."
          error={errors.codePrefix?.message}
          {...register('codePrefix', { required: 'Vui lòng nhập tiền tố mã' })}
        />

        <p className="rounded-xl bg-slate-50/80 px-4 py-3 text-xs text-slate-500">
          Lưới sẽ tạo {rows > 0 && cols > 0 ? <span className="font-semibold text-slate-700">{rows * cols}</span> : 'các'}{' '}
          chỗ đỗ trống bắt đầu từ vị trí đã chọn. Các vị trí đã có chỗ đỗ sẽ bị bỏ qua.
        </p>
      </form>
    </Modal>
  )
}
