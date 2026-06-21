import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { UserPlus, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { getErrorMessage } from '../../lib/apiClient'
import AuthLayout from './AuthLayout'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

export default function RegisterPage() {
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm()

  const onSubmit = async (values) => {
    setSubmitting(true)
    try {
      await registerUser({
        fullName: values.fullName,
        username: values.username,
        email: values.email,
        password: values.password,
        phoneNumber: values.phoneNumber || undefined,
      })
      toast.success('Đăng ký thành công')
      navigate('/', { replace: true })
    } catch (err) {
      toast.error(getErrorMessage(err, 'Đăng ký thất bại'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Tạo tài khoản</h2>
        <p className="mt-1 text-sm text-slate-500">
          Điền thông tin bên dưới để bắt đầu sử dụng hệ thống.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Họ và tên"
          placeholder="Nguyễn Văn A"
          autoComplete="name"
          error={errors.fullName?.message}
          {...register('fullName', {
            required: 'Vui lòng nhập họ tên',
            minLength: { value: 2, message: 'Họ tên tối thiểu 2 ký tự' },
            maxLength: { value: 100, message: 'Họ tên tối đa 100 ký tự' },
          })}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Tên đăng nhập"
            placeholder="nguyenvana"
            autoComplete="username"
            error={errors.username?.message}
            {...register('username', {
              required: 'Vui lòng nhập tên đăng nhập',
              minLength: { value: 3, message: 'Tối thiểu 3 ký tự' },
              maxLength: { value: 50, message: 'Tối đa 50 ký tự' },
              pattern: {
                value: /^[a-zA-Z0-9_.-]+$/,
                message: 'Chỉ gồm chữ, số và _ . -',
              },
            })}
          />
          <Input
            label="Số điện thoại"
            placeholder="0901234567"
            autoComplete="tel"
            error={errors.phoneNumber?.message}
            {...register('phoneNumber', {
              pattern: {
                value: /^[0-9+\s().-]{8,20}$/,
                message: 'Số điện thoại không hợp lệ',
              },
            })}
          />
        </div>

        <Input
          type="email"
          label="Email"
          placeholder="email@example.com"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email', {
            required: 'Vui lòng nhập email',
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email không hợp lệ' },
          })}
        />

        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            label="Mật khẩu"
            placeholder="••••••••"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register('password', {
              required: 'Vui lòng nhập mật khẩu',
              minLength: { value: 6, message: 'Mật khẩu tối thiểu 6 ký tự' },
              maxLength: { value: 100, message: 'Mật khẩu tối đa 100 ký tự' },
            })}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-[34px] text-slate-400 transition-colors hover:text-slate-600"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <Input
          type={showPassword ? 'text' : 'password'}
          label="Xác nhận mật khẩu"
          placeholder="••••••••"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword', {
            required: 'Vui lòng xác nhận mật khẩu',
            validate: (v) => v === watch('password') || 'Mật khẩu xác nhận không khớp',
          })}
        />

        <Button type="submit" size="lg" loading={submitting} className="w-full">
          <UserPlus className="h-4 w-4" />
          Đăng ký
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Đã có tài khoản?{' '}
        <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
          Đăng nhập
        </Link>
      </p>
    </AuthLayout>
  )
}
