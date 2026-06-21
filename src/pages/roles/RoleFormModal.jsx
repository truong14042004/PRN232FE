import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { roleService } from '../../services/roleService'
import { getErrorMessage } from '../../lib/apiClient'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Button from '../../components/ui/Button'
import { cn } from '../../lib/cn'

const emptyValues = () => ({
  name: '',
  description: '',
  permissions: '',
  isActive: true,
})

// Tách textarea thành mảng quyền: mỗi dòng 1 quyền, bỏ dòng trống và trùng lặp.
const parsePermissions = (text) => {
  const seen = new Set()
  const result = []
  for (const line of (text || '').split('\n')) {
    const p = line.trim()
    if (p && !seen.has(p)) {
      seen.add(p)
      result.push(p)
    }
  }
  return result
}

export default function RoleFormModal({ open, mode = 'create', role, onClose, onSaved }) {
  const isEdit = mode === 'edit'
  // Update API không nhận Name; tên vai trò bất biến khi sửa.
  const nameDisabled = isEdit

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({ defaultValues: emptyValues() })

  useEffect(() => {
    if (!open) return
    if (isEdit && role) {
      reset({
        name: role.name || '',
        description: role.description || '',
        permissions: (role.permissions || []).join('\n'),
        isActive: role.isActive ?? true,
      })
    } else {
      reset(emptyValues())
    }
  }, [open, isEdit, role, reset])

  const mutation = useMutation({
    mutationFn: (payload) =>
      isEdit ? roleService.update(role.id, payload) : roleService.create(payload),
    onSuccess: () => {
      toast.success(isEdit ? 'Đã cập nhật vai trò' : 'Đã tạo vai trò')
      onSaved?.()
      onClose?.()
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Lưu vai trò thất bại')),
  })

  const onSubmit = (values) => {
    const permissions = parsePermissions(values.permissions)
    if (isEdit) {
      // UpdateRoleRequest: description, permissions (required), isActive
      mutation.mutate({
        description: values.description?.trim() || undefined,
        permissions,
        isActive: values.isActive,
      })
    } else {
      // CreateRoleRequest: name, description, permissions
      mutation.mutate({
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        permissions,
      })
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Cập nhật vai trò' : 'Thêm vai trò'}
      description={
        isEdit
          ? 'Chỉnh sửa mô tả, quyền hạn và trạng thái vai trò.'
          : 'Tạo vai trò mới và gán các quyền hạn phù hợp.'
      }
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" form="role-form" loading={mutation.isPending}>
            {isEdit ? 'Lưu thay đổi' : 'Tạo vai trò'}
          </Button>
        </>
      }
    >
      <form id="role-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Tên vai trò"
          placeholder="ví dụ: ReportViewer"
          disabled={nameDisabled}
          hint={nameDisabled ? 'Không thể đổi tên vai trò khi sửa' : 'Chỉ gồm chữ, số, dấu . - _'}
          error={errors.name?.message}
          {...register('name', {
            validate: (v) =>
              nameDisabled ||
              (v.trim().length >= 2 &&
                v.trim().length <= 50 &&
                /^[a-zA-Z0-9_.-]+$/.test(v.trim())) ||
              'Tên 2-50 ký tự, chỉ gồm chữ, số, dấu . - _',
          })}
        />

        <Textarea
          label="Mô tả (tùy chọn)"
          placeholder="Mô tả ngắn về vai trò này..."
          rows={2}
          error={errors.description?.message}
          {...register('description', {
            maxLength: { value: 200, message: 'Mô tả tối đa 200 ký tự' },
          })}
        />

        <Textarea
          label="Quyền hạn"
          placeholder={'Mỗi dòng một quyền, ví dụ:\nreports.view\nreports.export'}
          rows={6}
          hint="Mỗi dòng tương ứng với một quyền hạn."
          {...register('permissions')}
        />

        {isEdit && (
          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-700">Kích hoạt vai trò</p>
                  <p className="text-xs text-slate-400">Vai trò có thể được gán cho người dùng</p>
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
        )}
      </form>
    </Modal>
  )
}
