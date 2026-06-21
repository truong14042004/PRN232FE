import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { reservationService } from '../../services/reservationService'
import { getErrorMessage } from '../../lib/apiClient'
import { toDateTimeLocal } from '../../lib/format'
import {
  useBuildingOptions,
  useVehicleTypeOptions,
  useZoneOptions,
} from '../../hooks/useOptions'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Textarea from '../../components/ui/Textarea'
import Button from '../../components/ui/Button'

// Mặc định: giữ chỗ từ bây giờ đến +2 giờ.
const defaultFrom = () => toDateTimeLocal(new Date())
const defaultTo = () => {
  const d = new Date()
  d.setHours(d.getHours() + 2)
  return toDateTimeLocal(d)
}

const emptyValues = () => ({
  buildingId: '',
  vehicleTypeId: '',
  plateNumber: '',
  zoneId: '',
  reservedFrom: defaultFrom(),
  reservedTo: defaultTo(),
  note: '',
})

export default function ReservationFormModal({ open, mode = 'create', reservation, hideZone = false, onClose, onSaved }) {
  const isEdit = mode === 'edit'
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({ defaultValues: emptyValues() })

  const buildingId = watch('buildingId')
  const { options: buildingOptions } = useBuildingOptions()
  const { options: vehicleTypeOptions } = useVehicleTypeOptions()
  const { options: zoneOptions } = useZoneOptions(buildingId, undefined, !hideZone)

  useEffect(() => {
    if (!open) return
    if (isEdit && reservation) {
      reset({
        buildingId: reservation.buildingId || '',
        vehicleTypeId: reservation.vehicleTypeId || '',
        plateNumber: reservation.plateNumber || '',
        zoneId: reservation.zoneId || '',
        reservedFrom: toDateTimeLocal(reservation.reservedFrom),
        reservedTo: toDateTimeLocal(reservation.reservedTo),
        note: reservation.note || '',
      })
    } else {
      reset(emptyValues())
    }
  }, [open, isEdit, reservation, reset])

  const mutation = useMutation({
    mutationFn: (payload) =>
      isEdit
        ? reservationService.update(reservation.id, payload)
        : reservationService.create(payload),
    onSuccess: () => {
      toast.success(isEdit ? 'Đã cập nhật đặt chỗ' : 'Đã tạo đặt chỗ')
      onSaved?.()
      onClose?.()
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Lưu đặt chỗ thất bại')),
  })

  const onSubmit = (values) => {
    if (isEdit) {
      // API update: zoneId?, reservedFrom, reservedTo, note?
      mutation.mutate({
        zoneId: values.zoneId || undefined,
        reservedFrom: new Date(values.reservedFrom).toISOString(),
        reservedTo: new Date(values.reservedTo).toISOString(),
        note: values.note?.trim() || undefined,
      })
    } else {
      mutation.mutate({
        buildingId: values.buildingId,
        vehicleTypeId: values.vehicleTypeId,
        plateNumber: values.plateNumber.trim(),
        zoneId: values.zoneId || undefined,
        reservedFrom: new Date(values.reservedFrom).toISOString(),
        reservedTo: new Date(values.reservedTo).toISOString(),
        note: values.note?.trim() || undefined,
      })
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Cập nhật đặt chỗ' : 'Tạo đặt chỗ'}
      description={
        isEdit
          ? 'Chỉnh sửa khu vực giữ chỗ và khung giờ.'
          : 'Tạo yêu cầu giữ chỗ trước cho khách hàng.'
      }
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" form="reservation-form" loading={mutation.isPending}>
            {isEdit ? 'Lưu thay đổi' : 'Tạo đặt chỗ'}
          </Button>
        </>
      }
    >
      <form id="reservation-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              onChange: () => setValue('zoneId', ''),
            })}
          />
          <Select
            label="Loại xe"
            placeholder="Chọn loại xe"
            options={vehicleTypeOptions}
            disabled={isEdit}
            hint={isEdit ? 'Không thể đổi loại xe sau khi tạo' : undefined}
            error={errors.vehicleTypeId?.message}
            {...register('vehicleTypeId', {
              validate: (v) => isEdit || !!v || 'Vui lòng chọn loại xe',
            })}
          />
        </div>

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
          {!hideZone && (
            <Select
              label="Khu vực (tùy chọn)"
              placeholder={buildingId ? 'Chọn khu vực' : 'Chọn tòa nhà trước'}
              options={zoneOptions}
              disabled={!buildingId}
              {...register('zoneId')}
            />
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            type="datetime-local"
            label="Giữ chỗ từ"
            error={errors.reservedFrom?.message}
            {...register('reservedFrom', { required: 'Vui lòng chọn thời gian bắt đầu' })}
          />
          <Input
            type="datetime-local"
            label="Giữ chỗ đến"
            error={errors.reservedTo?.message}
            {...register('reservedTo', { required: 'Vui lòng chọn thời gian kết thúc' })}
          />
        </div>

        <Textarea label="Ghi chú (tùy chọn)" placeholder="Ghi chú thêm..." {...register('note')} />
      </form>
    </Modal>
  )
}
