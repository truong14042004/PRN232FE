import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { incidentService } from '../../services/incidentService'
import { getErrorMessage } from '../../lib/apiClient'
import Modal from '../../components/ui/Modal'
import Textarea from '../../components/ui/Textarea'
import Button from '../../components/ui/Button'

// Modal xử lý/đóng sự cố kèm ghi chú xử lý (resolutionNote).
export default function ResolveIncidentModal({ open, incident, onClose, onSaved }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: { resolutionNote: '' } })

  useEffect(() => {
    if (open) reset({ resolutionNote: '' })
  }, [open, reset])

  const mutation = useMutation({
    mutationFn: (payload) => incidentService.resolve(incident.id, payload),
    onSuccess: () => {
      toast.success('Đã xử lý sự cố')
      onSaved?.()
      onClose?.()
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Xử lý sự cố thất bại')),
  })

  const onSubmit = (values) => {
    mutation.mutate({ resolutionNote: values.resolutionNote.trim() })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Xử lý sự cố"
      description={incident?.title ? `Sự cố: ${incident.title}` : 'Ghi chú cách xử lý và đóng sự cố.'}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" form="resolve-incident-form" loading={mutation.isPending}>
            Xác nhận xử lý
          </Button>
        </>
      }
    >
      <form id="resolve-incident-form" onSubmit={handleSubmit(onSubmit)}>
        <Textarea
          label="Ghi chú xử lý"
          rows={4}
          placeholder="Mô tả cách xử lý sự cố..."
          error={errors.resolutionNote?.message}
          {...register('resolutionNote', {
            required: 'Vui lòng nhập ghi chú xử lý',
            minLength: { value: 3, message: 'Ghi chú tối thiểu 3 ký tự' },
          })}
        />
      </form>
    </Modal>
  )
}
