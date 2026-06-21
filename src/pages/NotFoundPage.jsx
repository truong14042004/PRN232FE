import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Compass, ArrowLeft } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-glow">
          <Compass className="h-10 w-10" />
        </div>
        <p className="text-7xl font-black tracking-tight text-slate-900">404</p>
        <h1 className="mt-2 text-xl font-bold text-slate-800">Không tìm thấy trang</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
          Trang bạn tìm có thể đã bị di chuyển hoặc không tồn tại.
        </p>
        <Link to="/" className="btn-primary mt-6 inline-flex">
          <ArrowLeft className="h-4 w-4" />
          Về trang chủ
        </Link>
      </motion.div>
    </div>
  )
}
