import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Pencil } from 'lucide-react'
import { parkingSessionService } from '../../services/parkingSessionService'
import { getErrorMessage } from '../../lib/apiClient'
import { useVehicleTypeOptions } from '../../hooks/useOptions'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Textarea from '../../components/ui/Textarea'
import Button from '../../components/ui/Button'

// Sửa thông tin xe (biển số / loại xe) cho phiên đang gửi — xử lý sai thông tin xe.
export default function UpdateInfoModal({ open, session, onClose, onSaved }) {
  const [plateNumber, setPlateNumber] = useState('')
  const [vehicleTypeId, setVehicleTypeId] = useState('')
  const [note, setNote] = useState('')

  const { options: vehicleTypeOptions } = useVehicleTypeOptions()

  useEffect(() => {
    if (open && session) {
      setPlateNumber(session.plateNumber || '')
      setVehicleTypeId(session.vehicleTypeId || '')
      setNote('')
    }
  }, [open, session])

  const mutation = useMutation({
    mutationFn: () =>
      parkingSessionService.updateInfo(session.id, {
        plateNumber: plateNumber.trim(),
        vehicleTypeId: vehicleTypeId || undefined,
        note: note?.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Đã cập nhật thông tin xe')
      onSaved?.()
      onClose?.()
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Cập nhật thất bại')),
  })

  const changed =
    session &&
    (plateNumber.trim() !== session.plateNumber || vehicleTypeId !== session.vehicleTypeId)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Sửa thông tin xe"
      description={session ? `Cập nhật thông tin nhập nhầm cho phiên ${session.plateNumber}.` : undefined}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Hủy</Button>
          <Button onClick={() => mutation.mutate()} loading={mutation.isPending} disabled={!changed || !plateNumber.trim()}>
            <Pencil className="h-4 w-4" />
            Lưu thay đổi
          </Button>
        </>
      }
    >
      {session && (
        <div className="space-y-4">
          <Input
            label="Biển số xe"
            value={plateNumber}
            onChange={(e) => setPlateNumber(e.target.value)}
          />
          <Select
            label="Loại xe"
            placeholder="Chọn loại xe"
            options={vehicleTypeOptions}
            value={vehicleTypeId}
            onChange={(e) => setVehicleTypeId(e.target.value)}
          />
          <Textarea
            label="Lý do sửa (tùy chọn)"
            placeholder="Vd: nhập nhầm biển số khi cho xe vào"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      )}
    </Modal>
  )
}
