import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { LogIn, Sparkles } from 'lucide-react'
import { parkingSessionService } from '../../services/parkingSessionService'
import { parkingSlotService } from '../../services/parkingSlotService'
import { gateService } from '../../services/gateService'
import { optimizationService } from '../../services/optimizationService'
import { getErrorMessage } from '../../lib/apiClient'
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

const emptyValues = () => ({
  plateNumber: '',
  buildingId: '',
  vehicleTypeId: '',
  zoneId: '',
  parkingSlotId: '',
  entryGate: '',
  isMonthly: false,
  subscriptionId: '',
  checkInNote: '',
})

export default function CheckInModal({ open, onClose, onSaved }) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({ defaultValues: emptyValues() })

  const [autoSlot, setAutoSlot] = useState(true)

  const buildingId = watch('buildingId')
  const zoneId = watch('zoneId')
  const vehicleTypeId = watch('vehicleTypeId')
  const isMonthly = watch('isMonthly')

  // Gợi ý slot tối ưu bằng AI/thuật toán cho zone + loại xe đã chọn.
  const [suggestions, setSuggestions] = useState([])
  const suggestMutation = useMutation({
    mutationFn: () => optimizationService.suggestSlot({ zoneId, vehicleTypeId, topN: 5 }),
    onSuccess: (data) => {
      setSuggestions(data || [])
      if (!data || data.length === 0) toast('Không có gợi ý cho khu vực này')
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Không lấy được gợi ý')),
  })

  const { options: buildingOptions } = useBuildingOptions()
  const { options: vehicleTypeOptions } = useVehicleTypeOptions()
  const { options: zoneOptions } = useZoneOptions(buildingId)

  // Danh sách cổng vào theo tòa nhà (Entry=1 hoặc Both=3).
  const { data: gatesData } = useQuery({
    queryKey: ['gates', 'options', buildingId],
    queryFn: () => gateService.list({ buildingId, isActive: true, pageSize: 200 }),
    enabled: !!buildingId,
  })
  const gateOptions = (gatesData?.items || [])
    .filter((g) => g.type === 1 || g.type === 3)
    .map((g) => ({ value: g.code, label: `${g.name} (${g.code})` }))

  // Chỗ trống trong khu vực đã chọn (chỉ tải khi chọn chỗ thủ công).
  const { data: slotsData } = useQuery({
    queryKey: ['parking-slots', 'available', zoneId],
    queryFn: () => parkingSlotService.list({ zoneId, pageSize: 200 }),
    enabled: !!zoneId && !autoSlot,
  })
  const slotOptions = (slotsData?.items || [])
    .filter((s) => s.status === 1) // Available
    .map((s) => ({ value: s.id, label: `${s.code}${s.label ? ` - ${s.label}` : ''}` }))

  useEffect(() => {
    if (open) {
      reset(emptyValues())
      setAutoSlot(true)
      setSuggestions([])
    }
  }, [open, reset])

  // Khi đổi sang chế độ auto, xóa slot đã chọn.
  useEffect(() => {
    if (autoSlot) {
      setValue('parkingSlotId', '')
      setSuggestions([])
    }
  }, [autoSlot, setValue])

  const mutation = useMutation({
    mutationFn: (payload) => parkingSessionService.checkIn(payload),
    onSuccess: () => {
      toast.success('Đã cho xe vào bãi')
      onSaved?.()
      onClose?.()
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Cho xe vào thất bại')),
  })

  const onSubmit = (values) => {
    mutation.mutate({
      plateNumber: values.plateNumber.trim(),
      vehicleTypeId: values.vehicleTypeId,
      buildingId: values.buildingId,
      zoneId: values.zoneId,
      parkingSlotId: autoSlot ? undefined : values.parkingSlotId || undefined,
      entryGate: values.entryGate || undefined,
      isMonthly: !!values.isMonthly,
      subscriptionId: values.isMonthly ? values.subscriptionId?.trim() || undefined : undefined,
      checkInNote: values.checkInNote?.trim() || undefined,
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Cho xe vào bãi"
      description="Ghi nhận phương tiện vào bãi và gán vị trí đỗ."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" form="checkin-form" loading={mutation.isPending}>
            <LogIn className="h-4 w-4" />
            Cho xe vào
          </Button>
        </>
      }
    >
      <form id="checkin-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Biển số xe"
            placeholder="51A-123.45"
            error={errors.plateNumber?.message}
            {...register('plateNumber', { required: 'Vui lòng nhập biển số' })}
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
          <Select
            label="Tòa nhà"
            placeholder="Chọn tòa nhà"
            options={buildingOptions}
            error={errors.buildingId?.message}
            {...register('buildingId', { required: 'Vui lòng chọn tòa nhà' })}
          />
          <Select
            label="Khu vực"
            placeholder={buildingId ? 'Chọn khu vực' : 'Chọn tòa nhà trước'}
            options={zoneOptions}
            disabled={!buildingId}
            error={errors.zoneId?.message}
            {...register('zoneId', { required: 'Vui lòng chọn khu vực' })}
          />
        </div>

        {/* Chọn chỗ: tự động hoặc thủ công */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAutoSlot(true)}
              className={
                'flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ' +
                (autoSlot
                  ? 'border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-500/15'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50')
              }
            >
              Tự động chọn chỗ trống
            </button>
            <button
              type="button"
              onClick={() => setAutoSlot(false)}
              className={
                'flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ' +
                (!autoSlot
                  ? 'border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-500/15'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50')
              }
            >
              Chọn chỗ cụ thể
            </button>
          </div>
          {!autoSlot && (
            <>
              <Select
                placeholder={zoneId ? 'Chọn chỗ trống' : 'Chọn khu vực trước'}
                options={slotOptions}
                disabled={!zoneId}
                hint={zoneId && slotOptions.length === 0 ? 'Không còn chỗ trống trong khu vực này' : undefined}
                {...register('parkingSlotId', {
                  validate: (v) => autoSlot || !!v || 'Vui lòng chọn chỗ đỗ',
                })}
              />

              {/* Gợi ý slot tối ưu */}
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-indigo-700">
                    <Sparkles className="h-3.5 w-3.5" />
                    Gợi ý vị trí tối ưu
                  </span>
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-7 px-2.5 text-xs"
                    disabled={!zoneId || !vehicleTypeId}
                    loading={suggestMutation.isPending}
                    onClick={() => suggestMutation.mutate()}
                  >
                    Gợi ý chỗ (AI)
                  </Button>
                </div>
                {suggestions.length > 0 && (
                  <ul className="mt-2 space-y-1.5">
                    {suggestions.map((s) => (
                      <li key={s.slotId}>
                        <button
                          type="button"
                          onClick={() => setValue('parkingSlotId', s.slotId, { shouldValidate: true })}
                          className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm transition-colors hover:border-indigo-300 hover:bg-indigo-50"
                        >
                          <span>
                            <span className="font-semibold text-slate-800">{s.code}</span>
                            <span className="ml-2 text-xs text-slate-500">{s.reason}</span>
                          </span>
                          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                            {s.score} đ
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Cổng vào (tùy chọn)"
            placeholder={buildingId ? 'Chọn cổng' : 'Chọn tòa nhà trước'}
            options={gateOptions}
            disabled={!buildingId}
            {...register('entryGate')}
          />
          <div className="flex items-end">
            <label className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-2.5">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500/30"
                {...register('isMonthly')}
              />
              <span className="text-sm font-medium text-slate-700">Xe vé tháng</span>
            </label>
          </div>
        </div>

        {isMonthly && (
          <Input
            label="Mã vé tháng (subscriptionId)"
            placeholder="subscriptionId"
            {...register('subscriptionId')}
          />
        )}

        <Textarea label="Ghi chú (tùy chọn)" placeholder="Ghi chú thêm..." {...register('checkInNote')} />
      </form>
    </Modal>
  )
}
