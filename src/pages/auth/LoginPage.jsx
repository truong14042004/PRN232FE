import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { LogIn, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { getErrorMessage } from '../../lib/apiClient'
import { homePathForRoles } from '../../lib/navigation'
import AuthLayout from './AuthLayout'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const onSubmit = async (values) => {
    setSubmitting(true)
    try {
      const auth = await login(values)
      toast.success('Đăng nhập thành công')
      // Nếu bị chặn từ một trang cụ thể thì quay lại đó, ngược lại điều hướng theo vai trò.
      const fromPath = location.state?.from?.pathname
      const dest = fromPath && fromPath !== '/login' ? fromPath : homePathForRoles(auth?.user?.roles)
      navigate(dest, { replace: true })
    } catch (err) {
      toast.error(getErrorMessage(err, 'Đăng nhập thất bại'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Đăng nhập</h2>
        <p className="mt-1 text-sm text-slate-500">
          Chào mừng quay lại. Vui lòng nhập thông tin tài khoản của bạn.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          label="Tên đăng nhập hoặc email"
          placeholder="nguyenvana hoặc email@example.com"
          autoComplete="username"
          error={errors.usernameOrEmail?.message}
          {...register('usernameOrEmail', { required: 'Vui lòng nhập tên đăng nhập hoặc email' })}
        />

        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            label="Mật khẩu"
            placeholder="••••••••"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password', { required: 'Vui lòng nhập mật khẩu' })}
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

        <Button type="submit" size="lg" loading={submitting} className="w-full">
          <LogIn className="h-4 w-4" />
          Đăng nhập
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Chưa có tài khoản?{' '}
        <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700">
          Đăng ký ngay
        </Link>
      </p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-8 rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-500"
      >
        <span className="font-semibold text-slate-600">Gợi ý:</span> tài khoản mới đăng ký mặc định
        có vai trò <span className="font-medium">Tài xế</span>. Liên hệ quản trị viên để được cấp
        quyền nhân viên hoặc quản lý.
      </motion.div>
    </AuthLayout>
  )
}
