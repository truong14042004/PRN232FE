import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { AlertTriangle } from 'lucide-react'
import { parkingSessionService } from '../../services/parkingSessionService'
import { getErrorMessage } from '../../lib/apiClient'
import Modal from '../../components/ui/Modal'
import Textarea from '../../components/ui/Textarea'
import Button from '../../components/ui/Button'

export default function MarkExceptionModal({ open, session, onClose, onSaved }) {
  const [note, setNote] = useState('')

  useEffect(() => {
    if (open) {
      setNote('')
    }
  }, [open])

  const mutation = useMutation({
    mutationFn: () => parkingSessionService.markException(session.id, note.trim()),
    onSuccess: () => {
      toast.success('Đã đánh dấu ngoại lệ')
      onSaved?.()
      onClose?.()
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Đánh dấu ngoại lệ thất bại')),
  })

  const handleSubmit = () => {
    if (!note.trim()) {
      toast.error('Vui lòng nhập lý do ngoại lệ')
      return
    }
    mutation.mutate()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Đánh dấu ngoại lệ"
      description={
        session ? `Đánh dấu phiên biển số ${session.plateNumber} là ngoại lệ.` : undefined
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button
            variant="danger"
            onClick={handleSubmit}
            loading={mutation.isPending}
          >
            <AlertTriangle className="h-4 w-4" />
            Xác nhận ngoại lệ
          </Button>
        </>
      }
    >
      {session && (
        <div className="space-y-4">
          <div className="rounded-xl bg-red-50/80 p-4 text-sm">
            <div className="flex items-center gap-2 font-medium text-red-700">
              <AlertTriangle className="h-4 w-4" />
              Phiên sẽ bị đánh dấu ngoại lệ
            </div>
            <p className="mt-1 text-red-600/80">
              Xe biển số <strong>{session.plateNumber}</strong> gửi từ{' '}
              {new Date(session.checkInTime).toLocaleString('vi-VN')}.
              Slot sẽ được giải phóng và zone occupancy sẽ giảm.
            </p>
          </div>
          <Textarea
            label="Lý do ngoại lệ"
            placeholder="VD: Xe quá hạn gửi, bất thường..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            autoFocus
          />
        </div>
      )}
    </Modal>
  )
}
