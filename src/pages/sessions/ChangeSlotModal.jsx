import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Replace } from 'lucide-react'
import { parkingSessionService } from '../../services/parkingSessionService'
import { parkingSlotService } from '../../services/parkingSlotService'
import { zoneService } from '../../services/zoneService'
import { getErrorMessage } from '../../lib/apiClient'
import Modal from '../../components/ui/Modal'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'

export default function ChangeSlotModal({ open, session, onClose, onSaved }) {
  const [zoneId, setZoneId] = useState('')
  const [slotId, setSlotId] = useState('')

  useEffect(() => {
    if (open && session) {
      setZoneId(session.zoneId || '')
      setSlotId('')
    }
  }, [open, session])

  // Khu vực trong cùng tòa nhà của phiên.
  const { data: zonesData } = useQuery({
    queryKey: ['zones', 'options', session?.buildingId],
    queryFn: () =>
      zoneService.list({ buildingId: session.buildingId, isActive: true, pageSize: 200 }),
    enabled: !!session?.buildingId && open,
  })
  const zoneOptions = (zonesData?.items || []).map((z) => ({ value: z.id, label: z.name }))

  // Chỗ trống trong khu vực đã chọn.
  const { data: slotsData } = useQuery({
    queryKey: ['parking-slots', 'available', zoneId],
    queryFn: () => parkingSlotService.list({ zoneId, pageSize: 200 }),
    enabled: !!zoneId && open,
  })
  const slotOptions = (slotsData?.items || [])
    .filter((s) => s.status === 1 && s.id !== session?.parkingSlotId) // Available, khác chỗ hiện tại
    .map((s) => ({ value: s.id, label: `${s.code}${s.label ? ` - ${s.label}` : ''}` }))

  const mutation = useMutation({
    mutationFn: (newSlotId) => parkingSessionService.changeSlot(session.id, newSlotId),
    onSuccess: () => {
      toast.success('Đã đổi chỗ đỗ')
      onSaved?.()
      onClose?.()
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Đổi chỗ thất bại')),
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Đổi chỗ đỗ"
      description={session ? `Đổi vị trí đỗ cho biển số ${session.plateNumber}.` : undefined}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button
            onClick={() => slotId && mutation.mutate(slotId)}
            disabled={!slotId}
            loading={mutation.isPending}
          >
            <Replace className="h-4 w-4" />
            Đổi chỗ
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Select
          label="Khu vực"
          placeholder="Chọn khu vực"
          options={zoneOptions}
          value={zoneId}
          onChange={(e) => {
            setZoneId(e.target.value)
            setSlotId('')
          }}
        />
        <Select
          label="Chỗ đỗ mới"
          placeholder={zoneId ? 'Chọn chỗ trống' : 'Chọn khu vực trước'}
          options={slotOptions}
          value={slotId}
          disabled={!zoneId}
          hint={
            zoneId && slotOptions.length === 0
              ? 'Không còn chỗ trống trong khu vực này'
              : undefined
          }
          onChange={(e) => setSlotId(e.target.value)}
        />
      </div>
    </Modal>
  )
}
