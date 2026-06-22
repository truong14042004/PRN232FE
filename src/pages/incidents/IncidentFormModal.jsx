import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { incidentService } from '../../services/incidentService'
import { getErrorMessage } from '../../lib/apiClient'
import { INCIDENT_TYPE_OPTIONS, INCIDENT_STATUS_OPTIONS } from '../../lib/incidentEnums'
import { useBuildingOptions } from '../../hooks/useOptions'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Textarea from '../../components/ui/Textarea'
import Button from '../../components/ui/Button'

const emptyValues = () => ({
  buildingId: '',
  type: 0,
  title: '',
  description: '',
  plateNumber: '',
  occupyingPlateNumber: '',
  parkingSessionId: '',
  parkingSlotId: '',
  vehicleId: '',
  status: 1,
})

export default function IncidentFormModal({ open, mode = 'create', incident, onClose, onSaved }) {
  const isEdit = mode === 'edit'
  const { options: buildingOptions } = useBuildingOptions()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: emptyValues() })

  // Đổ dữ liệu khi mở ở chế độ sửa.
  useEffect(() => {
    if (!open) return
    if (isEdit && incident) {
      reset({
        buildingId: incident.buildingId || '',
        type: incident.type ?? 0,
        title: incident.title || '',
        description: incident.description || '',
        plateNumber: incident.plateNumber || '',
        occupyingPlateNumber: incident.occupyingPlateNumber || '',
        parkingSessionId: incident.parkingSessionId || '',
        parkingSlotId: incident.parkingSlotId || '',
        vehicleId: incident.vehicleId || '',
        status: incident.status ?? 1,
      })
    } else {
      reset(emptyValues())
    }
  }, [open, isEdit, incident, reset])

  const mutation = useMutation({
    mutationFn: (payload) =>
      isEdit ? incidentService.update(incident.id, payload) : incidentService.create(payload),
    onSuccess: () => {
      toast.success(isEdit ? 'Đã cập nhật sự cố' : 'Đã ghi nhận sự cố')
      onSaved?.()
      onClose?.()
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Lưu sự cố thất bại')),
  })

  const onSubmit = (values) => {
    if (isEdit) {
      // UpdateIncidentRequest: title/description/type/status + liên kết (tùy chọn).
      mutation.mutate({
        title: values.title.trim(),
        description: values.description.trim(),
        type: Number(values.type),
        status: Number(values.status),
        plateNumber: values.plateNumber?.trim() || undefined,
        occupyingPlateNumber: values.occupyingPlateNumber?.trim() || undefined,
        parkingSessionId: values.parkingSessionId?.trim() || undefined,
        parkingSlotId: values.parkingSlotId?.trim() || undefined,
        vehicleId: values.vehicleId?.trim() || undefined,
      })
    } else {
      // CreateIncidentRequest: buildingId + type + title + description + liên kết (tùy chọn).
      mutation.mutate({
        buildingId: values.buildingId,
        type: Number(values.type),
        title: values.title.trim(),
        description: values.description.trim(),
        plateNumber: values.plateNumber?.trim() || undefined,
        occupyingPlateNumber: values.occupyingPlateNumber?.trim() || undefined,
        parkingSessionId: values.parkingSessionId?.trim() || undefined,
        parkingSlotId: values.parkingSlotId?.trim() || undefined,
        vehicleId: values.vehicleId?.trim() || undefined,
      })
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Cập nhật sự cố' : 'Ghi nhận sự cố'}
      description={
        isEdit
          ? 'Chỉnh sửa nội dung, loại và trạng thái sự cố.'
          : 'Ghi nhận một sự cố mới phát sinh trong bãi.'
      }
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" form="incident-form" loading={mutation.isPending}>
            {isEdit ? 'Lưu thay đổi' : 'Ghi nhận'}
          </Button>
        </>
      }
    >
      <form id="incident-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Tòa nhà"
            placeholder="Chọn tòa nhà"
            options={buildingOptions}
            disabled={isEdit}
            hint={isEdit ? 'Không thể đổi tòa nhà' : undefined}
            error={errors.buildingId?.message}
            {...register('buildingId', {
              validate: (v) => isEdit || !!v || 'Vui lòng chọn tòa nhà',
            })}
          />
          <Select label="Loại sự cố" options={INCIDENT_TYPE_OPTIONS} {...register('type')} />
        </div>

        <Input
          label="Tiêu đề"
          placeholder="VD: Khách báo mất vé ở cổng B"
          error={errors.title?.message}
          {...register('title', {
            required: 'Vui lòng nhập tiêu đề',
            minLength: { value: 3, message: 'Tiêu đề tối thiểu 3 ký tự' },
          })}
        />

        <Textarea
          label="Mô tả chi tiết"
          rows={4}
          placeholder="Mô tả diễn biến sự cố..."
          error={errors.description?.message}
          {...register('description', { required: 'Vui lòng nhập mô tả' })}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Biển số xe khách báo (tùy chọn)"
            placeholder="VD: 51F-123.45"
            {...register('plateNumber')}
          />
          <Input
            label="Biển số xe vi phạm / chiếm chỗ (tùy chọn)"
            placeholder="VD: 59X1-678.90"
            {...register('occupyingPlateNumber')}
          />
        </div>

        {isEdit && (
          <Select label="Trạng thái" options={INCIDENT_STATUS_OPTIONS} {...register('status')} />
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input
            label="Mã phiên gửi (tùy chọn)"
            placeholder="parkingSessionId"
            {...register('parkingSessionId')}
          />
          <Input
            label="Mã chỗ đỗ (tùy chọn)"
            placeholder="parkingSlotId"
            {...register('parkingSlotId')}
          />
          <Input label="Mã xe (tùy chọn)" placeholder="vehicleId" {...register('vehicleId')} />
        </div>
      </form>
    </Modal>
  )
}
