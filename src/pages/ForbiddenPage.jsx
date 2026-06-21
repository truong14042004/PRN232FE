import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldX, Home } from 'lucide-react'
import Button from '../components/ui/Button'

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50 text-red-500">
          <ShieldX className="h-10 w-10" />
        </div>
        <p className="text-sm font-semibold uppercase tracking-wide text-red-500">403</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          Không có quyền truy cập
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
          Tài khoản của bạn không được cấp quyền xem trang này. Vui lòng liên hệ quản trị viên nếu
          bạn cho rằng đây là nhầm lẫn.
        </p>
        <Link to="/" className="mt-6 inline-block">
          <Button>
            <Home className="h-4 w-4" />
            Về trang chủ
          </Button>
        </Link>
      </motion.div>
    </div>
  )
}
