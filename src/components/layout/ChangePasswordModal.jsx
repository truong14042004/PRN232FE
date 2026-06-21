import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { authService } from '../../services/authService'
import { getErrorMessage } from '../../lib/apiClient'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Button from '../ui/Button'

export default function ChangePasswordModal({ open, onClose }) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm()

  const mutation = useMutation({
    mutationFn: (payload) => authService.changePassword(payload),
    onSuccess: () => {
      toast.success('Đổi mật khẩu thành công')
      reset()
      onClose?.()
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Đổi mật khẩu thất bại')),
  })

  const onSubmit = (values) => {
    mutation.mutate({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    })
  }

  const handleClose = () => {
    reset()
    onClose?.()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Đổi mật khẩu"
      description="Nhập mật khẩu hiện tại và mật khẩu mới của bạn."
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            Hủy
          </Button>
          <Button
            type="submit"
            form="change-password-form"
            loading={mutation.isPending}
          >
            Cập nhật
          </Button>
        </>
      }
    >
      <form id="change-password-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          type="password"
          label="Mật khẩu hiện tại"
          placeholder="••••••••"
          error={errors.currentPassword?.message}
          {...register('currentPassword', { required: 'Vui lòng nhập mật khẩu hiện tại' })}
        />
        <Input
          type="password"
          label="Mật khẩu mới"
          placeholder="••••••••"
          error={errors.newPassword?.message}
          {...register('newPassword', {
            required: 'Vui lòng nhập mật khẩu mới',
            minLength: { value: 6, message: 'Mật khẩu tối thiểu 6 ký tự' },
          })}
        />
        <Input
          type="password"
          label="Xác nhận mật khẩu mới"
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword', {
            required: 'Vui lòng xác nhận mật khẩu',
            validate: (v) => v === watch('newPassword') || 'Mật khẩu xác nhận không khớp',
          })}
        />
      </form>
    </Modal>
  )
}
