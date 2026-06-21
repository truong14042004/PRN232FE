import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { userService } from '../../services/userService'
import { getErrorMessage } from '../../lib/apiClient'
import { ROLES, ROLE_LABELS } from '../../lib/enums'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { cn } from '../../lib/cn'

const ALL_ROLES = [ROLES.Admin, ROLES.FacilityManager, ROLES.ParkingStaff, ROLES.Driver]

const emptyValues = () => ({
  fullName: '',
  username: '',
  email: '',
  password: '',
  phoneNumber: '',
  avatarUrl: '',
  roles: [ROLES.Driver],
  isActive: true,
})

export default function UserFormModal({ open, mode = 'create', user, onClose, onSaved }) {
  const isEdit = mode === 'edit'
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({ defaultValues: emptyValues() })

  // Đổ dữ liệu khi mở ở chế độ sửa.
  useEffect(() => {
    if (!open) return
    if (isEdit && user) {
      reset({
        fullName: user.fullName || '',
        username: user.username || '',
        email: user.email || '',
        password: '',
        phoneNumber: user.phoneNumber || '',
        avatarUrl: user.avatarUrl || '',
        roles: user.roles?.length ? user.roles : [ROLES.Driver],
        isActive: user.isActive ?? true,
      })
    } else {
      reset(emptyValues())
    }
  }, [open, isEdit, user, reset])

  const mutation = useMutation({
    mutationFn: (payload) =>
      isEdit ? userService.update(user.id, payload) : userService.create(payload),
    onSuccess: () => {
      toast.success(isEdit ? 'Đã cập nhật người dùng' : 'Đã tạo người dùng')
      onSaved?.()
      onClose?.()
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Lưu người dùng thất bại')),
  })

  const onSubmit = (values) => {
    if (isEdit) {
      // API update: fullName, email, phoneNumber, avatarUrl, roles, isActive (không username/password)
      mutation.mutate({
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        phoneNumber: values.phoneNumber?.trim() || undefined,
        avatarUrl: values.avatarUrl?.trim() || undefined,
        roles: values.roles,
        isActive: values.isActive,
      })
    } else {
      mutation.mutate({
        fullName: values.fullName.trim(),
        username: values.username.trim(),
        email: values.email.trim(),
        password: values.password,
        phoneNumber: values.phoneNumber?.trim() || undefined,
        avatarUrl: values.avatarUrl?.trim() || undefined,
        roles: values.roles,
        isActive: values.isActive,
      })
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Cập nhật người dùng' : 'Thêm người dùng'}
      description={
        isEdit
          ? 'Chỉnh sửa thông tin, vai trò và trạng thái tài khoản.'
          : 'Tạo tài khoản mới và gán vai trò phù hợp.'
      }
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" form="user-form" loading={mutation.isPending}>
            {isEdit ? 'Lưu thay đổi' : 'Tạo người dùng'}
          </Button>
        </>
      }
    >
      <form id="user-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Họ và tên"
            placeholder="Nguyễn Văn A"
            error={errors.fullName?.message}
            {...register('fullName', {
              required: 'Vui lòng nhập họ tên',
              minLength: { value: 2, message: 'Họ tên tối thiểu 2 ký tự' },
            })}
          />
          <Input
            label="Tên đăng nhập"
            placeholder="nguyenvana"
            disabled={isEdit}
            hint={isEdit ? 'Không thể đổi tên đăng nhập' : undefined}
            error={errors.username?.message}
            {...register('username', {
              validate: (v) =>
                isEdit ||
                (v.trim().length >= 3 && /^[a-zA-Z0-9_.-]+$/.test(v.trim())) ||
                'Tối thiểu 3 ký tự, chỉ gồm chữ, số, _ . -',
            })}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            type="email"
            label="Email"
            placeholder="email@example.com"
            error={errors.email?.message}
            {...register('email', {
              required: 'Vui lòng nhập email',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email không hợp lệ' },
            })}
          />
          <Input
            label="Số điện thoại (tùy chọn)"
            placeholder="0901234567"
            {...register('phoneNumber')}
          />
        </div>

        {!isEdit && (
          <Input
            type="password"
            label="Mật khẩu"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password', {
              required: 'Vui lòng nhập mật khẩu',
              minLength: { value: 6, message: 'Mật khẩu tối thiểu 6 ký tự' },
            })}
          />
        )}

        <Input
          label="Ảnh đại diện (URL, tùy chọn)"
          placeholder="https://..."
          {...register('avatarUrl')}
        />

        {/* Chọn vai trò */}
        <Controller
          control={control}
          name="roles"
          rules={{ validate: (v) => (v?.length ?? 0) >= 1 || 'Chọn ít nhất một vai trò' }}
          render={({ field, fieldState }) => (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Vai trò</label>
              <div className="grid grid-cols-2 gap-2">
                {ALL_ROLES.map((role) => {
                  const checked = field.value?.includes(role)
                  return (
                    <button
                      type="button"
                      key={role}
                      onClick={() =>
                        field.onChange(
                          checked
                            ? field.value.filter((r) => r !== role)
                            : [...(field.value || []), role],
                        )
                      }
                      className={cn(
                        'flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all',
                        checked
                          ? 'border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-500/15'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-4 w-4 items-center justify-center rounded border transition-colors',
                          checked ? 'border-brand-600 bg-brand-600' : 'border-slate-300',
                        )}
                      >
                        {checked && (
                          <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                            <path
                              d="M2.5 6L5 8.5L9.5 3.5"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </span>
                      {ROLE_LABELS[role] || role}
                    </button>
                  )
                })}
              </div>
              {fieldState.error && (
                <p className="text-xs font-medium text-red-600">{fieldState.error.message}</p>
              )}
            </div>
          )}
        />

        {/* Trạng thái hoạt động */}
        <Controller
          control={control}
          name="isActive"
          render={({ field }) => (
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-700">Kích hoạt tài khoản</p>
                <p className="text-xs text-slate-400">Cho phép người dùng đăng nhập hệ thống</p>
              </div>
              <button
                type="button"
                onClick={() => field.onChange(!field.value)}
                className={cn(
                  'relative h-6 w-11 shrink-0 rounded-full transition-colors',
                  field.value ? 'bg-brand-600' : 'bg-slate-300',
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                    field.value ? 'translate-x-[22px]' : 'translate-x-0.5',
                  )}
                />
              </button>
            </label>
          )}
        />
      </form>
    </Modal>
  )
}
